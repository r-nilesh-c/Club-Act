import React, { useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import { usePayment } from '../../hooks/usePayment';
import './Form.css';

function Form({ selectedEvent, event, onClose, onSubmit, isSubmitting = false }) {
  // Use selectedEvent if available (from EventDetails), otherwise use event (from old modal)
  const eventData = selectedEvent || event;
  const { user } = useUser();
  const { 
    processIndividualPayment, 
    processTeamPayment, 
    processPaymentFallback, 
    isProcessing,
    isRazorpayConfigured 
  } = usePayment();
  
  // Check if event supports group participation
  const isGroupEvent = eventData.participation_type === 'group';
  
  const [formData, setFormData] = useState({
    // Individual fields
    name: '',
    email: '',
    phone: '',
    studentId: '',
    year: '',
    department: '',
    dietaryRestrictions: '',
    emergencyContact: '',
    emergencyPhone: '',
    
    // Group fields (for group events)
    teamName: '',
    teamMembers: isGroupEvent ? [{ name: '', email: '', phone: '', studentId: '' }] : [],
    isTeamLeader: true
  });

  const [errors, setErrors] = useState({});

  // Calculate pricing based on user type
  const calculatePrice = () => {
    console.log('eventData:', eventData); // Debug log
    console.log('eventData.price:', eventData.price); // Debug log
    const basePrice = parseFloat(eventData.price) || 0;
    console.log('basePrice:', basePrice); // Debug log
    
    // Calculate total members for team events
    const totalMembers = isGroupEvent ? (formData.teamMembers.length + 1) : 1; // +1 for team leader
    
    if (user.userType === 'member') {
      const discountRate = user.membershipType === 'executive' ? 0.5 : 0.3; // 50% for executives, 30% for regular members
      const discountedPricePerMember = basePrice * (1 - discountRate);
      const totalOriginalPrice = basePrice * totalMembers;
      const totalFinalPrice = discountedPricePerMember * totalMembers;
      
      return {
        originalPrice: totalOriginalPrice,
        finalPrice: totalFinalPrice,
        pricePerMember: discountedPricePerMember,
        discount: totalOriginalPrice - totalFinalPrice,
        discountPercentage: discountRate * 100,
        totalMembers: totalMembers
      };
    }
    
    const totalPrice = basePrice * totalMembers;
    return {
      originalPrice: totalPrice,
      finalPrice: totalPrice,
      pricePerMember: basePrice,
      discount: 0,
      discountPercentage: 0,
      totalMembers: totalMembers
    };
  };

  const pricingInfo = calculatePrice();

  // Helper function to get user type
  const getUserType = () => {
    return user?.userType || 'guest';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle team member changes
  const handleTeamMemberChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.map((member, i) => 
        i === index ? { ...member, [field]: value } : member
      )
    }));
  };

  // Add team member
  const addTeamMember = () => {
    const maxTeamSize = event.team_size_max || 5;
    if (formData.teamMembers.length < maxTeamSize - 1) { // -1 because team leader is not in this array
      setFormData(prev => ({
        ...prev,
        teamMembers: [...prev.teamMembers, { name: '', email: '', phone: '', studentId: '' }]
      }));
    }
  };

  // Remove team member
  const removeTeamMember = (index) => {
    setFormData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Individual participant validation (always required)
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.studentId.trim()) newErrors.studentId = 'Student ID is required';
    if (!formData.year) newErrors.year = 'Year is required';
    if (!formData.department.trim()) newErrors.department = 'Department is required';
    if (!formData.emergencyContact.trim()) newErrors.emergencyContact = 'Emergency contact is required';
    if (!formData.emergencyPhone.trim()) newErrors.emergencyPhone = 'Emergency phone is required';

    // Group event specific validation
    if (isGroupEvent) {
      if (!formData.teamName.trim()) newErrors.teamName = 'Team name is required';
      
      const totalTeamSize = formData.teamMembers.length + 1; // +1 for team leader
      const minSize = event.team_size_min || 2;
      const maxSize = event.team_size_max || 5;
      
      if (totalTeamSize < minSize) {
        newErrors.teamSize = `Team must have at least ${minSize} members (including you)`;
      }
      if (totalTeamSize > maxSize) {
        newErrors.teamSize = `Team cannot exceed ${maxSize} members (including you)`;
      }

      // Validate team members
      formData.teamMembers.forEach((member, index) => {
        if (!member.name.trim()) {
          newErrors[`teamMember_${index}_name`] = `Team member ${index + 1} name is required`;
        }
        if (!member.email.trim()) {
          newErrors[`teamMember_${index}_email`] = `Team member ${index + 1} email is required`;
        } else if (!/\S+@\S+\.\S+/.test(member.email)) {
          newErrors[`teamMember_${index}_email`] = `Team member ${index + 1} email is invalid`;
        }
        if (!member.studentId.trim()) {
          newErrors[`teamMember_${index}_studentId`] = `Team member ${index + 1} student ID is required`;
        }
      });

      // Check for duplicate emails
      const allEmails = [formData.email, ...formData.teamMembers.map(m => m.email)].filter(email => email.trim());
      const uniqueEmails = new Set(allEmails);
      if (allEmails.length !== uniqueEmails.size) {
        newErrors.duplicateEmail = 'Each team member must have a unique email address';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      let paymentResult;
      
      if (isGroupEvent) {
        // Process team payment
        const teamLeaderData = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone
        };
        
        if (isRazorpayConfigured) {
          paymentResult = await processTeamPayment(
            event, 
            teamLeaderData, 
            formData.teamMembers, 
            pricingInfo.discountPercentage / 100
          );
        } else {
          paymentResult = await processPaymentFallback(
            event, 
            teamLeaderData, 
            true, 
            formData.teamMembers
          );
        }
      } else {
        // Process individual payment
        const userData = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone
        };
        
        if (isRazorpayConfigured) {
          paymentResult = await processIndividualPayment(
            event, 
            userData, 
            pricingInfo.discountPercentage / 100
          );
        } else {
          paymentResult = await processPaymentFallback(event, userData, false);
        }
      }

      if (paymentResult.success) {
        // Prepare registration data
        const registrationData = {
          ...formData,
          event_id: event.id,
          amount_paid: paymentResult.paymentData.amount,
          payment_id: paymentResult.paymentData.paymentId,
          payment_status: 'completed',
          user_type: getUserType()
        };

        // Submit registration
        await onSubmit(registrationData);
      }
    } catch (error) {
      setErrors({ submit: error.message || 'Payment failed. Please try again.' });
    }
  };

  return (
    <div className={onClose ? "form-overlay" : "form-embedded"}>
      <div className="form-container">
        <div className="form-header">
          <h2>Register for {eventData.title}</h2>
          {onClose && (
            <button className="close-btn" onClick={onClose}>&times;</button>
          )}
        </div>
        
        <div className="event-summary">
          <p><strong>Date:</strong> {eventData.date}</p>
          <p><strong>Time:</strong> {eventData.time}</p>
          <p><strong>Location:</strong> {eventData.location}</p>
          
          <div className="pricing-info">
            {isGroupEvent && (
              <div className="team-pricing-summary">
                <p><strong>Team Size:</strong> {pricingInfo.totalMembers} members</p>
                <p><strong>Price per member:</strong> ₹{Math.round(pricingInfo.pricePerMember)}</p>
              </div>
            )}
            
            {user.userType === 'member' && pricingInfo.discount > 0 ? (
              <div className="member-pricing">
                <p className="original-price">
                  <strong>Original {isGroupEvent ? 'Total' : ''} Price:</strong> 
                  <span className="strikethrough">₹{pricingInfo.originalPrice}</span>
                </p>
                <p className="discount-info">
                  <strong>🎉 Member Discount ({pricingInfo.discountPercentage}%):</strong> 
                  <span className="discount-amount">-₹{pricingInfo.discount}</span>
                </p>
                <p className="final-price">
                  <strong>Your {isGroupEvent ? 'Total' : ''} Price:</strong> 
                  <span className="discounted-price">₹{pricingInfo.finalPrice}</span>
                </p>
                <div className="member-benefits">
                  <small>🏷️ {user.membershipType === 'executive' ? 'Executive Member' : 'Club Member'} Benefits Applied!</small>
                </div>
              </div>
            ) : (
              <p><strong>{isGroupEvent ? 'Total' : ''} Price:</strong> ₹{pricingInfo.finalPrice}</p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-section">
            <h3>Personal Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={errors.phone ? 'error' : ''}
                />
                {errors.phone && <span className="error-message">{errors.phone}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="studentId">Student ID *</label>
                <input
                  type="text"
                  id="studentId"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  className={errors.studentId ? 'error' : ''}
                />
                {errors.studentId && <span className="error-message">{errors.studentId}</span>}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Academic Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="year">Year *</label>
                <select
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className={errors.year ? 'error' : ''}
                >
                  <option value="">Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                  <option value="graduate">Graduate</option>
                </select>
                {errors.year && <span className="error-message">{errors.year}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="department">Department *</label>
                <input
                  type="text"
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="e.g., Computer Science"
                  className={errors.department ? 'error' : ''}
                />
              </div>
            </div>
          </div>

          {/* Group Participation Section */}
          {isGroupEvent && (
            <div className="form-section group-section">
              <h3>🏆 Team Information</h3>
              
              {errors.teamSize && <div className="error-message team-error">{errors.teamSize}</div>}
              {errors.duplicateEmail && <div className="error-message team-error">{errors.duplicateEmail}</div>}
              
              <div className="team-info">
                <p className="team-requirements">
                  <strong>Team Requirements:</strong> {event.team_size_min || 2} - {event.team_size_max || 5} members
                </p>
                <p className="current-team-size">
                  Current team size: {formData.teamMembers.length + 1} member(s)
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="teamName">Team Name *</label>
                <input
                  type="text"
                  id="teamName"
                  name="teamName"
                  value={formData.teamName}
                  onChange={handleChange}
                  placeholder="Enter your team name"
                  className={errors.teamName ? 'error' : ''}
                />
                {errors.teamName && <span className="error-message">{errors.teamName}</span>}
              </div>

              <div className="team-leader-info">
                <h4>🎯 Team Leader (You)</h4>
                <p>As the person registering, you are automatically the team leader.</p>
              </div>

              <div className="team-members-section">
                <div className="team-members-header">
                  <h4>👥 Team Members</h4>
                  <button
                    type="button"
                    className="btn btn-small btn-outline"
                    onClick={addTeamMember}
                    disabled={formData.teamMembers.length >= (event.team_size_max || 5) - 1}
                  >
                    ➕ Add Member
                  </button>
                </div>

                {formData.teamMembers.map((member, index) => (
                  <div key={index} className="team-member-form">
                    <div className="team-member-header">
                      <h5>Team Member {index + 1}</h5>
                      <button
                        type="button"
                        className="btn btn-small btn-danger"
                        onClick={() => removeTeamMember(index)}
                      >
                        ✕ Remove
                      </button>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor={`teamMember_${index}_name`}>Full Name *</label>
                        <input
                          type="text"
                          id={`teamMember_${index}_name`}
                          value={member.name}
                          onChange={(e) => handleTeamMemberChange(index, 'name', e.target.value)}
                          placeholder="Enter full name"
                          className={errors[`teamMember_${index}_name`] ? 'error' : ''}
                        />
                        {errors[`teamMember_${index}_name`] && 
                          <span className="error-message">{errors[`teamMember_${index}_name`]}</span>
                        }
                      </div>

                      <div className="form-group">
                        <label htmlFor={`teamMember_${index}_email`}>Email *</label>
                        <input
                          type="email"
                          id={`teamMember_${index}_email`}
                          value={member.email}
                          onChange={(e) => handleTeamMemberChange(index, 'email', e.target.value)}
                          placeholder="Enter email address"
                          className={errors[`teamMember_${index}_email`] ? 'error' : ''}
                        />
                        {errors[`teamMember_${index}_email`] && 
                          <span className="error-message">{errors[`teamMember_${index}_email`]}</span>
                        }
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor={`teamMember_${index}_phone`}>Phone Number</label>
                        <input
                          type="tel"
                          id={`teamMember_${index}_phone`}
                          value={member.phone}
                          onChange={(e) => handleTeamMemberChange(index, 'phone', e.target.value)}
                          placeholder="Enter phone number"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor={`teamMember_${index}_studentId`}>Student ID *</label>
                        <input
                          type="text"
                          id={`teamMember_${index}_studentId`}
                          value={member.studentId}
                          onChange={(e) => handleTeamMemberChange(index, 'studentId', e.target.value)}
                          placeholder="Enter student ID"
                          className={errors[`teamMember_${index}_studentId`] ? 'error' : ''}
                        />
                        {errors[`teamMember_${index}_studentId`] && 
                          <span className="error-message">{errors[`teamMember_${index}_studentId`]}</span>
                        }
                      </div>
                    </div>
                  </div>
                ))}

                {formData.teamMembers.length === 0 && (
                  <div className="no-team-members">
                    <p>No team members added yet. Click "Add Member" to add your first team member.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="form-section">
            <h3>Additional Information</h3>
            <div className="form-group">
              <label htmlFor="dietaryRestrictions">Dietary Restrictions</label>
              <textarea
                id="dietaryRestrictions"
                name="dietaryRestrictions"
                value={formData.dietaryRestrictions}
                onChange={handleChange}
                placeholder="Please mention any dietary restrictions or allergies"
                rows="3"
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Emergency Contact</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="emergencyContact">Emergency Contact Name *</label>
                <input
                  type="text"
                  id="emergencyContact"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  className={errors.emergencyContact ? 'error' : ''}
                />
                {errors.emergencyContact && <span className="error-message">{errors.emergencyContact}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="emergencyPhone">Emergency Contact Phone *</label>
                <input
                  type="tel"
                  id="emergencyPhone"
                  name="emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={handleChange}
                  className={errors.emergencyPhone ? 'error' : ''}
                />
                {errors.emergencyPhone && <span className="error-message">{errors.emergencyPhone}</span>}
              </div>
            </div>
          </div>

          <div className="form-actions">
            {onClose && (
              <button type="button" className="cancel-btn" onClick={onClose} disabled={isSubmitting || isProcessing}>
                Cancel
              </button>
            )}
            <button type="submit" className="submit-btn" disabled={isSubmitting || isProcessing}>
              {isProcessing ? (
                <>
                  <span className="spinner"></span>
                  Processing Payment...
                </>
              ) : isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  Registering...
                </>
              ) : (
                `Pay ₹${pricingInfo.finalPrice} & Register${isGroupEvent ? ` (${pricingInfo.totalMembers} members)` : ''}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Form;
