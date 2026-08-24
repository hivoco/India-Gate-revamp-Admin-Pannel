const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token");

  return {
    Authorization: `Bearer ${token}`,
  };
};

export async function getBlogs(page = 1, perPage = 10) {
  const res = await fetch(`/api/blogs?page=${page}&per_page=${perPage}`, {
    credentials: "include",
    headers: getAuthHeaders(),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message);

  return { data };
}

// the categories already in use, to populate the suggestion list on the form
export async function getBlogCategories() {
  const res = await fetch("/api/blogs/categories", {
    credentials: "include",
    headers: getAuthHeaders(),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message);

  return { data };
}

export async function getBlog(id: number) {
  const res = await fetch(`/api/blogs?id=${id}`, {
    credentials: "include",
    headers: getAuthHeaders(),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message);

  return { data };
}

export async function createBlog(body: FormData) {
  const res = await fetch("/api/blogs", {
    method: "POST",
    credentials: "include",
    headers: getAuthHeaders(),
    body,
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message);

  return { data };
}

export async function updateBlog(id: number, body: FormData) {
  const res = await fetch(`/api/blogs?id=${id}`, {
    method: "PUT",
    credentials: "include",
    headers: getAuthHeaders(),
    body,
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message);

  return { data };
}
export async function uploadBlogImage(file: File) {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch("/api/blogs/upload-image", {
    method: "POST",
    credentials: "include",
    headers: getAuthHeaders(),
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message);

  return { data };
}

export async function deleteBlog(id: number) {
  const res = await fetch(`/api/blogs?id=${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: getAuthHeaders(),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message);

  return { data };
}
