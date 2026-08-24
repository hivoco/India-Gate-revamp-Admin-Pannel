const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token");

  return {
    Authorization: `Bearer ${token}`,
  };
};

export async function getFaqs(page = 1, perPage = 10, pageKey?: string) {
  const query = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });

  // empty means "every page", which is the default view of the list
  if (pageKey) query.set("page_key", pageKey);

  const res = await fetch(`/api/faqs?${query}`, {
    credentials: "include",
    headers: getAuthHeaders(),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message);

  return { data };
}

// the categories that already exist on the hub, used to populate the
// suggestion list on the form. public, no auth needed
export async function getFaqCategories() {
  const res = await fetch("/api/faqs/categories", {
    credentials: "include",
    headers: getAuthHeaders(),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message);

  return { data };
}

export async function getFaq(id: number) {
  const res = await fetch(`/api/faqs?id=${id}`, {
    credentials: "include",
    headers: getAuthHeaders(),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message);

  return { data };
}

export async function createFaq(body: unknown) {
  const res = await fetch("/api/faqs", {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message);

  return { data };
}

export async function updateFaq(id: number, body: unknown) {
  const res = await fetch(`/api/faqs?id=${id}`, {
    method: "PUT",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message);

  return { data };
}

export async function deleteFaq(id: number) {
  const res = await fetch(`/api/faqs?id=${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: getAuthHeaders(),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message);

  return { data };
}
