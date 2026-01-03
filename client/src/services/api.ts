const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Utility function to extract error message from unknown error types
export const getErrorMessage = (err: unknown, fallback: string = 'An error occurred'): string => {
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
};

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const fetchContent = async (type?: string, limit: number = 10, offset: number = 0) => {
  const params = new URLSearchParams();
  if (type) params.append('type', type);
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());

  const response = await fetch(`${API_URL}/content?${params.toString()}`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch content');
  }
  return response.json();
};

export const fetchContentById = async (id: number) => {
  const response = await fetch(`${API_URL}/content/${id}`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch content');
  }
  return response.json();
};

export const fetchMyTickets = async () => {
  const response = await fetch(`${API_URL}/tickets/my-tickets`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch tickets');
  }
  return response.json();
};

export const fetchMyStatements = async (limit: number = 10, offset: number = 0) => {
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());

  const response = await fetch(`${API_URL}/billing/my-statements?${params.toString()}`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch statements');
  }
  return response.json();
};

export const downloadStatement = async (id: number, filename: string) => {
  const response = await fetch(`${API_URL}/billing/download/${id}`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to download statement');
  }
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

export const createContent = async (data: any) => {
  const response = await fetch(`${API_URL}/admin/content`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create content');
  }
  return response.json();
};

export const updateContent = async (id: number, data: any) => {
  const response = await fetch(`${API_URL}/admin/content/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update content');
  }
  return response.json();
};

export const deleteContent = async (id: number) => {
  const response = await fetch(`${API_URL}/admin/content/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to delete content');
  }
  return response.json();
};

export const updateContentStatus = async (id: number, status: string) => {
  const response = await fetch(`${API_URL}/admin/content/${id}/status`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    throw new Error('Failed to update status');
  }
  return response.json();
};

export const pinContent = async (id: number, isPinned: boolean) => {
  const response = await fetch(`${API_URL}/admin/content/${id}/pin`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ isPinned }),
  });
  if (!response.ok) {
    throw new Error('Failed to pin content');
  }
  return response.json();
};

export const fetchUsers = async () => {
  const response = await fetch(`${API_URL}/users`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  return response.json();
};

export const createInvite = async (email: string, role: string, name: string) => {
  const response = await fetch(`${API_URL}/admin/invites`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email, role, name }),
  });
  if (!response.ok) {
    throw new Error('Failed to create invite');
  }
  return response.json();
};

export const updateUser = async (id: number, data: any) => {
  const response = await fetch(`${API_URL}/users/${id}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update user');
  }
  return response.json();
};

export const deleteUser = async (id: number) => {
  const response = await fetch(`${API_URL}/users/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to delete user');
  }
  return response.json();
};

export const fetchEventAttendees = async (eventId: number) => {
  const response = await fetch(`${API_URL}/admin/events/${eventId}/tickets`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch attendees');
  }
  return response.json();
};

export const issueTickets = async (eventId: number, userIds: number[]) => {
  const response = await fetch(`${API_URL}/admin/events/${eventId}/tickets`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ userIds }),
  });
  if (!response.ok) {
    throw new Error('Failed to issue tickets');
  }
  return response.json();
};

export const fetchAllStatements = async () => {
  const response = await fetch(`${API_URL}/admin/billing/statements`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch statements');
  }
  return response.json();
};

export const uploadBilling = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/admin/billing/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: formData,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload billing');
  }
  return response.json();
};

export const checkInTicket = async (ticketToken: string, eventId: number) => {
  const response = await fetch(`${API_URL}/staff/check-in`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ ticketToken, eventId }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.reason || 'Check-in failed');
  }
  return response.json();
};

// Dashboard API methods
export const getDashboardMetrics = async () => {
  const response = await fetch(`${API_URL}/admin/events/metrics`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch metrics');
  }
  return response.json();
};

export const getDashboardEvents = async (params: { page?: number; limit?: number; status?: string; search?: string }) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.status) queryParams.append('status', params.status);
  if (params.search) queryParams.append('search', params.search);

  const response = await fetch(`${API_URL}/admin/events?${queryParams.toString()}`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch events');
  }
  return response.json();
};

// Event Detail API methods
export const getEventDetail = async (eventId: number) => {
  const response = await fetch(`${API_URL}/admin/events/${eventId}`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Event not found');
    }
    throw new Error(`Failed to fetch event detail: ${response.status} ${response.statusText}`);
  }
  return response.json();
};

export const getEventAttendees = async (
  eventId: number,
  params: { page?: number; search?: string }
) => {
  const queryParams = new URLSearchParams();
  queryParams.append('page', (params.page || 1).toString());
  // Note: limit parameter omitted; backend enforces a fixed value of 20 per API contract
  if (params.search) queryParams.append('search', params.search);

  const response = await fetch(
    `${API_URL}/admin/events/${eventId}/attendees?${queryParams.toString()}`,
    {
      headers: getHeaders(),
    }
  );
  if (!response.ok) {
    throw new Error('Failed to fetch attendees');
  }
  return response.json();
};

export const getSelectableUsers = async (search?: string) => {
  const queryParams = new URLSearchParams();
  if (search) queryParams.append('search', search);

  const response = await fetch(
    `${API_URL}/users/selectable?${queryParams.toString()}`,
    {
      headers: getHeaders(),
    }
  );
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  return response.json();
};
