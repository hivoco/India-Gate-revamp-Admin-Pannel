/* Insta Posts feature commented out.
const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token");

  return {
    Authorization: `Bearer ${token}`,
  };
};

export async function getInstaPosts(page = 1, perPage = 10) {
  const res = await fetch(`/api/insta-posts?page=${page}&per_page=${perPage}`, {
    credentials: "include",
    headers: getAuthHeaders(),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message);

  return { data };
}

export async function createInstaPost(postUrl: string, sortOrder: number) {
  const res = await fetch("/api/insta-posts", {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ post_url: postUrl, sort_order: sortOrder }),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message);

  return { data };
}

export async function updateInstaPost(id: number, sortOrder: number) {
  const res = await fetch(`/api/insta-posts?id=${id}`, {
    method: "PUT",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ sort_order: sortOrder }),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message);

  return { data };
}

export async function deleteInstaPost(id: number) {
  const res = await fetch(`/api/insta-posts?id=${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: getAuthHeaders(),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message);

  return { data };
}
*/