export const getLoggedInUserId = (): string | null => {
  // Replace this with actual logic to retrieve the logged-in user's ID
  const token = localStorage.getItem('authToken');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userId || null;
  } catch (error) {
    console.error('Failed to parse token:', error);
    return null;
  }
};
