import { useState } from 'react';
import { registrationsAPI } from '../lib/database';

export const useRegistration = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitRegistration = async (eventId, registrationData, event) => {
    try {
      setIsSubmitting(true);

      // First, check if registrations are open for this event
      if (!event || event.status !== 'active') {
        throw new Error('Registration is currently closed for this event.');
      }

      // Check if this is a team event
      const isTeamEvent = event?.participation_type === 'group';

      // Check if Supabase is configured
      if (process.env.REACT_APP_SUPABASE_URL && 
          process.env.REACT_APP_SUPABASE_URL !== 'your-project-url') {
        
        if (isTeamEvent) {
          // Handle team registration
          return await submitTeamRegistration(eventId, registrationData);
        } else {
          // Handle individual registration
          return await submitIndividualRegistration(eventId, registrationData);
        }
      } else {
        // Fallback for demo mode
        const message = isTeamEvent 
          ? `Demo: Team "${registrationData.teamName}" registration successful! (Connect to Supabase for real functionality)`
          : `Demo: Registration successful for ${registrationData.name}! (Connect to Supabase for real functionality)`;
        
        return {
          success: true,
          message
        };
      }
    } catch (err) {
      return {
        success: false,
        message: err.message || 'Registration failed. Please try again.'
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitIndividualRegistration = async (eventId, registrationData) => {
    // Check for existing registration
    const existingRegistration = await registrationsAPI.checkExistingRegistration(
      eventId, 
      registrationData.email
    );
    
    if (existingRegistration) {
      throw new Error('You are already registered for this event!');
    }

    // Create registration in Supabase
    await registrationsAPI.createRegistration({
      event_id: eventId,
      name: registrationData.name,
      email: registrationData.email,
      phone: registrationData.phone,
      student_id: registrationData.studentId,
      year: registrationData.year,
      department: registrationData.department,
      dietary_restrictions: registrationData.dietaryRestrictions,
      emergency_contact: registrationData.emergencyContact,
      emergency_phone: registrationData.emergencyPhone
    });
    
    return {
      success: true,
      message: `Registration successful for ${registrationData.name}! You will receive a confirmation email shortly.`
    };
  };

  const submitTeamRegistration = async (eventId, registrationData) => {
    // Validate team size
    const teamSize = registrationData.teamMembers.length;
    
    // Check for duplicate emails within the team
    const emails = registrationData.teamMembers.map(member => member.email.toLowerCase());
    const uniqueEmails = new Set(emails);
    
    if (emails.length !== uniqueEmails.size) {
      throw new Error('Team members cannot have duplicate email addresses!');
    }

    // Check if any team member is already registered for this event
    for (const member of registrationData.teamMembers) {
      const existingRegistration = await registrationsAPI.checkExistingRegistration(
        eventId, 
        member.email
      );
      
      if (existingRegistration) {
        throw new Error(`${member.name} (${member.email}) is already registered for this event!`);
      }
    }

    // Create team registration in Supabase
    const result = await registrationsAPI.createTeamRegistration({
      event_id: eventId,
      team_name: registrationData.teamName,
      teamMembers: registrationData.teamMembers,
      amount_paid: 0 // Will be updated after payment
    });
    
    return {
      success: true,
      message: `Team registration successful for "${registrationData.teamName}" with ${teamSize} members! You will receive confirmation emails shortly.`,
      teamRegistrationId: result.teamRegistrationId
    };
  };

  return {
    submitRegistration,
    isSubmitting
  };
};
