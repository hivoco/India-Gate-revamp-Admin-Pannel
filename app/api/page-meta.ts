const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token");

  return {
    Authorization: `Bearer ${token}`,
  };
};

export async function getAllPageMeta() {
  const res = await fetch("/api/page-meta", {
    credentials: "include",
    headers: getAuthHeaders(),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message);

  return { data };
}

export async function savePageMeta(body: {
  page_key: string;
  title?: string | null;
  description?: string | null;
  og_image?: string | null;
}) {
  const res = await fetch("/api/page-meta", {
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
