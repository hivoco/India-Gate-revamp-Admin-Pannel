const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token");

  return {
    Authorization: `Bearer ${token}`,
  };
};

export async function getStats() {
  const res = await fetch("/api/dashboard", {
    credentials: "include",
    headers: getAuthHeaders(),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message);

  return { data };
}
