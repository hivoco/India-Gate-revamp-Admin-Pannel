const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token");

  return {
    Authorization: `Bearer ${token}`,
  };
};

export async function getAdmins(page = 1, perPage = 10) {
  const res = await fetch(`/api/admins?page=${page}&per_page=${perPage}`, {
    credentials: "include",
    headers: getAuthHeaders(),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message);

  return { data };
}

export async function getAdmin(id: number) {
  const res = await fetch(`/api/admins?id=${id}`, {
    credentials: "include",
    headers: getAuthHeaders(),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message);

  return { data };
}

export async function createAdmin(body: {
  email: string;
  password: string;
  permissions?: string[];
}) {
  const res = await fetch("/api/admins", {
    method: "POST",
    credentials: "include",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message);

  return { data };
}

export async function updateAdmin(
  id: number,
  body: {
    email?: string;
    password?: string;
    permissions?: string[];
  },
) {
  const res = await fetch(`/api/admins?id=${id}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message);

  return { data };
}

export async function deleteAdmin(id: number) {
  const res = await fetch(`/api/admins?id=${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: getAuthHeaders(),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message);

  return { data };
}
