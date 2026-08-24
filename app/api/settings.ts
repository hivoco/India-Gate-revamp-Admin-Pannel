const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token");

  return {
    Authorization: `Bearer ${token}`,
  };
};

export async function getSettings() {
  const res = await fetch("/api/settings", {
    credentials: "include",
    headers: getAuthHeaders(),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message);

  return { data };
}

export async function saveSettings(values: Record<string, string>) {
  const res = await fetch("/api/settings", {
    method: "PUT",
    credentials: "include",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(values),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message);

  return { data };
}
