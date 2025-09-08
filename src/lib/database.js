import { supabase } from './supabase'

// Test Supabase connection
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('id')
      .limit(1);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Events API
export const eventsAPI = {
  // Get all events
  async getAllEvents() {
    try {
      // Test basic connection first
      const { data: testData, error: testError } = await supabase
        .from('events')
        .select('count', { count: 'exact', head: true });
      
      if (testError) {
        throw new Error(`Connection failed: ${testError.message}`);
      }
      
      // Now fetch the actual data - show all events regardless of status
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      
      return data || [];
    } catch (error) {
      throw error;
    }
  },

  // Get a specific event by ID
  async getEventById(id) {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      throw error
    }
  },

  // Create a new event
  async createEvent(eventData) {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert([eventData])
        .select()
      
      if (error) {
        console.error('Supabase error details:', error);
        throw new Error(`Database error: ${error.message} (Code: ${error.code})`);
      }
      return data[0]
    } catch (error) {
      throw error
    }
  },

  // Update an event
  async updateEvent(id, eventData) {
    try {
      const { data, error } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', id)
        .select()
      
      if (error) throw error
      return data[0]
    } catch (error) {
      throw error
    }
  },

  // Delete an event
  async deleteEvent(id) {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return true
    } catch (error) {
      throw error
    }
  }
}

// Registrations API
export const registrationsAPI = {
  // Create a new individual registration
  async createRegistration(registrationData) {
    try {
      // First, check if the event allows registrations
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('status')
        .eq('id', registrationData.event_id)
        .single();
      
      if (eventError) {
        throw new Error(`Event not found: ${eventError.message}`);
      }
      
      if (eventData.status !== 'active') {
        throw new Error('Registration is closed for this event.');
      }

      const insertData = {
        ...registrationData,
        created_at: new Date().toISOString(),
        payment_status: registrationData.payment_status || 'pending',
        amount_paid: registrationData.amount_paid || 0,
        payment_id: registrationData.payment_id || null,
        is_team_leader: false,
        team_name: null,
        team_registration_id: null
      };
      
      const { data, error } = await supabase
        .from('registrations')
        .insert([insertData])
        .select();
      
      if (error) {
        if (error.code === '42501') {
          throw new Error('Registration system has permission restrictions. Please check the database configuration.');
        }
        
        if (error.code === '23505') {
          throw new Error('You are already registered for this event.');
        }
        
        throw new Error(`Registration failed: ${error.message}`);
      }
      
      return data[0];
    } catch (error) {
      throw error;
    }
  },

  // Create a team registration
  async createTeamRegistration(teamData) {
    try {
      // First, check if the event allows registrations
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('status')
        .eq('id', teamData.event_id)
        .single();
      
      if (eventError) {
        throw new Error(`Event not found: ${eventError.message}`);
      }
      
      if (eventData.status !== 'active') {
        throw new Error('Registration is closed for this event.');
      }

      // Generate a unique team registration ID
      const teamRegistrationId = `team_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      // Prepare team members data
      const teamMembers = teamData.teamMembers.map((member, index) => ({
        event_id: teamData.event_id,
        name: member.name,
        email: member.email,
        phone: member.phone || '',
        student_id: member.student_id || '',
        year: member.year || '',
        department: member.department || '',
        dietary_restrictions: member.dietary_restrictions || '',
        emergency_contact: member.emergency_contact || '',
        emergency_phone: member.emergency_phone || '',
        team_name: teamData.team_name,
        team_registration_id: teamRegistrationId,
        is_team_leader: index === 0, // First member is the team leader
        payment_status: teamData.payment_status || 'pending',
        amount_paid: teamData.amount_paid || 0,
        payment_id: teamData.payment_id || null,
        created_at: new Date().toISOString()
      }));
      
      const { data, error } = await supabase
        .from('registrations')
        .insert(teamMembers)
        .select();
      
      if (error) {
        if (error.code === '42501') {
          throw new Error('Registration system has permission restrictions. Please check the database configuration.');
        }
        
        if (error.code === '23505') {
          throw new Error('One or more team members are already registered for this event.');
        }
        
        throw new Error(`Team registration failed: ${error.message}`);
      }
      
      return {
        teamRegistrationId,
        teamMembers: data
      };
    } catch (error) {
      throw error;
    }
  },

  // Get registrations for a specific event
  async getEventRegistrations(eventId) {
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    } catch (error) {
      throw error
    }
  },

  // Get team registrations for a group event
  async getTeamRegistrations(eventId) {
    try {
      const { data, error } = await supabase
        .from('team_registrations')
        .select('*')
        .eq('event_id', eventId)
        .order('team_name', { ascending: true })
      
      if (error) throw error
      return data
    } catch (error) {
      throw error
    }
  },

  // Get registration count for an event (handles both individual and team events)
  async getRegistrationCount(eventId) {
    try {
      // First, get the event to check participation type
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('participation_type')
        .eq('id', eventId)
        .single()
      
      if (eventError) throw eventError
      
      if (eventData.participation_type === 'group') {
        // For group events, count distinct teams
        const { data, error } = await supabase
          .from('registrations')
          .select('team_registration_id')
          .eq('event_id', eventId)
          .eq('payment_status', 'completed')
          .not('team_registration_id', 'is', null)
        
        if (error) throw error
        
        // Count unique team registration IDs
        const uniqueTeams = new Set(data.map(r => r.team_registration_id))
        return uniqueTeams.size
      } else {
        // For individual events, count individual registrations
        const { count, error } = await supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId)
          .eq('payment_status', 'completed')
          .is('team_registration_id', null)
        
        if (error) throw error
        return count || 0
      }
    } catch (error) {
      throw error
    }
  },

  // Update payment status
  async updatePaymentStatus(registrationId, status) {
    try {
      const { data, error } = await supabase
        .from('registrations')
        .update({ payment_status: status })
        .eq('id', registrationId)
        .select()
      
      if (error) throw error
      return data[0]
    } catch (error) {
      throw error
    }
  },

  // Check if user is already registered for an event
  async checkExistingRegistration(eventId, email) {
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('event_id', eventId)
        .eq('email', email)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      return data
    } catch (error) {
      throw error
    }
  }
}
