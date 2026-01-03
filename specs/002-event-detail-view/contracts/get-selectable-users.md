# GET /api/users/selectable

**Description**: Fetch all users available for ticket issuance (active and invited users)

**Authentication**: Required (JWT token)  
**Authorization**: ADMIN role only

---

## Request

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `search` | string | No | - | Filter by user name or email (partial match, case-insensitive) |

### Headers

```http
Authorization: Bearer <jwt_token>
```

### Example

```http
GET /api/users/selectable?search=john HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Response

### Success (200 OK)

**Headers**:
```http
Content-Type: application/json
```

**Body**:
```json
{
  "users": [
    {
      "id": 12,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "status": "ACTIVE"
    },
    {
      "id": 24,
      "name": null,
      "email": "jane.new@example.com",
      "status": "INVITED"
    },
    {
      "id": 8,
      "name": "Johnny Smith",
      "email": "johnny@example.com",
      "status": "ACTIVE"
    }
  ]
}
```

**Field Descriptions**:
- `id`: Unique user identifier
- `name`: User's display name (from `unit_id` field), may be `null` if not set
- `email`: User's email address (always present)
- `status`: User activation status
  - `ACTIVE`: User has completed account activation
  - `INVITED`: User invited but hasn't activated account yet

**Sorting**: Users returned in alphabetical order by name (or email if name is null)

---

### Error Responses

#### 401 Unauthorized

**Reason**: Missing or invalid JWT token

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

---

#### 403 Forbidden

**Reason**: Authenticated user does not have ADMIN role

```json
{
  "error": "Forbidden",
  "message": "Admin access required"
}
```

---

#### 500 Internal Server Error

**Reason**: Database error or unexpected server failure

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

---

## Business Logic

1. **Authentication**: Verify JWT token is valid and not expired
2. **Authorization**: Ensure user has `role = "ADMIN"`
3. **Filter Users**: Query `User` table where `status IN ("ACTIVE", "INVITED")`
   - Exclude SUSPENDED users
   - Include both activated and pending activation users
4. **Apply Search**: If `search` param provided, filter by:
   - `email LIKE %search%` OR
   - `unit_id LIKE %search%`
5. **Sort**: Order by `unit_id` (if not null) else `email`, ascending
6. **Return**: Array of user objects

---

## Use Cases

### Use Case 1: Populate Dropdown for Ticket Issuance

**Scenario**: Admin clicks "Issue Tickets" button on event detail page

**Client Behavior**:
1. Fetch all selectable users: `GET /api/users/selectable`
2. Populate multi-select dropdown with results
3. Display user status indicator:
   - "John Doe (john@example.com) - Active"
   - "jane.new@example.com - Invited"

**UX Note**: Invited users are included because admins can issue tickets to them. Once invited user activates account, they'll be able to see their tickets.

---

### Use Case 2: Search for Specific User

**Scenario**: Admin has 100+ users, types "john" in search field

**Request**:
```http
GET /api/users/selectable?search=john
```

**Response**: Only users matching "john" in name or email

**Client Behavior**:
- Debounce search input (300ms delay)
- Clear previous results, show loading state
- Update dropdown with filtered results
- If no results: show "No users found matching 'john'"

---

## Performance Considerations

- **Query Time**: <50ms with index on `User(status, email, unit_id)`
- **Payload Size**: ~2KB for 100 users
- **Pagination**: Not implemented (assumes <500 total users for MVP)
  - If user base grows beyond 500, consider adding pagination or server-side search
- **Caching**: Not implemented (user list changes infrequently, but status changes matter)

---

## Examples

### Example 1: All Users (No Search)

**Request**:
```http
GET /api/users/selectable
```

**Response**:
```json
{
  "users": [
    {
      "id": 5,
      "name": "Alice Anderson",
      "email": "alice@example.com",
      "status": "ACTIVE"
    },
    {
      "id": 12,
      "name": "Bob Brown",
      "email": "bob@example.com",
      "status": "ACTIVE"
    },
    {
      "id": 24,
      "name": null,
      "email": "charlie@example.com",
      "status": "INVITED"
    },
    {
      "id": 8,
      "name": "Diana Davis",
      "email": "diana@example.com",
      "status": "ACTIVE"
    }
  ]
}
```

---

### Example 2: Search by Name

**Request**:
```http
GET /api/users/selectable?search=brown
```

**Response**:
```json
{
  "users": [
    {
      "id": 12,
      "name": "Bob Brown",
      "email": "bob@example.com",
      "status": "ACTIVE"
    }
  ]
}
```

---

### Example 3: Search by Email

**Request**:
```http
GET /api/users/selectable?search=charlie
```

**Response**:
```json
{
  "users": [
    {
      "id": 24,
      "name": null,
      "email": "charlie@example.com",
      "status": "INVITED"
    }
  ]
}
```

---

### Example 4: No Results

**Request**:
```http
GET /api/users/selectable?search=xyz999
```

**Response**:
```json
{
  "users": []
}
```

---

## Security Considerations

- **Admin Only**: Endpoint restricted to ADMIN role (unauthorized users cannot list members)
- **No Password Hashes**: Response excludes sensitive fields (password_hash)
- **No Role Filtering**: Returns all ACTIVE/INVITED users regardless of role (admin can issue tickets to other admins)
- **Rate Limiting**: Standard rate limit applies (100 req/15min per IP/user)

---

## Integration Notes

**Frontend Component** (React):

```typescript
// In IssueTicketsModal component
const [users, setUsers] = useState([]);
const [searchQuery, setSearchQuery] = useState('');

useEffect(() => {
  const fetchUsers = async () => {
    const data = await api.getSelectableUsers(searchQuery);
    setUsers(data.users);
  };
  
  const debounce = setTimeout(fetchUsers, 300);
  return () => clearTimeout(debounce);
}, [searchQuery]);

// Transform for react-select
const options = users.map(u => ({
  value: u.id,
  label: u.name || u.email,
  email: u.email,
  status: u.status
}));
```

**Display Format** in dropdown:
```
John Doe (john@example.com) [Active]
jane.new@example.com [Invited]
```
