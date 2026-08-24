const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token");

  return {
    Authorization: `Bearer ${token}`,
  };
};

export async function getHomeSlides() {
  const res = await fetch("/api/home-slides", {
    credentials: "include",
    headers: getAuthHeaders(),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message);

  return { data };
}

export async function createHomeSlide(body: FormData) {
  const res = await fetch("/api/home-slides", {
    method: "POST",
    credentials: "include",
    headers: getAuthHeaders(),
    body,
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message);

  return { data };
}

export async function updateHomeSlide(id: number, body: FormData) {
  const res = await fetch(`/api/home-slides?id=${id}`, {
    method: "PUT",
    credentials: "include",
    headers: getAuthHeaders(),
    body,
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message);

  return { data };
}

export async function deleteHomeSlide(id: number) {
  const res = await fetch(`/api/home-slides?id=${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: getAuthHeaders(),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message);

  return { data };
}
