# Database Architecture for Individual and Team Events

## Summary of Approach

✅ **Single Table Approach**: We extended the existing tables rather than creating separate ones, which provides:
- Simpler queries and maintenance
- Better performance
- Unified registration management
- Easier reporting and analytics

## Database Schema

### 1. Events Table (Extended)
```sql
-- New columns added:
participation_type VARCHAR(20) DEFAULT 'individual' -- 'individual' or 'group'
team_size_min INTEGER DEFAULT NULL                   -- Min team members (for group events)
team_size_max INTEGER DEFAULT NULL                   -- Max team members (for group events)
```

**Benefits:**
- All events (individual/group) in one table
- Easy to query and filter
- Maintains existing event structure

### 2. Registrations Table (Extended)
```sql
-- New columns added:
team_name VARCHAR(255) DEFAULT NULL           -- Team name (for group events)
is_team_leader BOOLEAN DEFAULT false          -- Identifies team leader
team_registration_id VARCHAR(50) DEFAULT NULL -- Groups team members together
```

**Benefits:**
- Individual registrations: `team_registration_id` is NULL
- Team registrations: All team members share the same `team_registration_id`
- Team leader is clearly identified
- Can easily count individuals vs teams

## Key Features Implemented

### 1. Smart Registration Counting
- **Individual Events**: Count individual registrations
- **Group Events**: Count unique teams (not individual members)
- **Mixed Support**: Database views handle both types automatically

### 2. Team Management
- **Team Registration ID**: Unique identifier linking team members
- **Team Leader**: First member in team is automatically the leader
- **Team Validation**: Ensures team size is within event limits

### 3. Database Views
- **`event_stats`**: Provides registration counts for both individual and team events
- **`team_registrations`**: Detailed team information with member lists

### 4. API Functions
- **`createRegistration()`**: For individual events
- **`createTeamRegistration()`**: For team events with multiple members
- **`getRegistrationCount()`**: Smart counting based on event type

## Usage Examples

### Individual Event Registration
```javascript
await registrationsAPI.createRegistration({
  event_id: 1,
  name: "John Doe",
  email: "john@example.com",
  // ... other individual fields
});
```

### Team Event Registration
```javascript
await registrationsAPI.createTeamRegistration({
  event_id: 2,
  team_name: "Code Warriors",
  teamMembers: [
    { name: "Alice", email: "alice@example.com", ... },
    { name: "Bob", email: "bob@example.com", ... },
    { name: "Carol", email: "carol@example.com", ... }
  ]
});
```

## Database Constraints

### 1. Team Size Validation
```sql
CHECK (
  (participation_type = 'individual' AND team_size_min IS NULL) OR
  (participation_type = 'group' AND team_size_min IS NOT NULL AND team_size_min <= team_size_max)
)
```

### 2. Unique Registration Constraints
- **Individual Events**: One registration per email per event
- **Team Events**: One registration per email per team per event

### 3. Team Registration ID Generation
- Format: `team_{timestamp}_{random}`
- Ensures uniqueness across all teams

## Frontend Integration

### 1. Event Creation (AddEvent Component)
- Executives can specify participation type
- Group events require min/max team size
- Form validation ensures proper team constraints

### 2. Registration Forms (Form Component)
- **Individual Events**: Standard registration form
- **Group Events**: Team name + multiple member forms
- Dynamic validation based on event type

### 3. Registration Processing (useRegistration Hook)
- Automatically detects event type
- Routes to appropriate registration function
- Handles validation for both individual and team scenarios

## Benefits of This Architecture

1. **Scalability**: Easy to add new event types or team features
2. **Performance**: Single queries can handle mixed event types
3. **Consistency**: Unified approach to event management
4. **Flexibility**: Can easily generate reports across all event types
5. **Simplicity**: Developers work with familiar table structure

## Migration Path

To update existing database:
1. Run `updated_schema.sql` to add new columns
2. Existing events automatically become 'individual' type
3. No data loss or breaking changes
4. New team events can be created immediately

This architecture provides a robust foundation for handling both individual and team events while maintaining simplicity and performance.
