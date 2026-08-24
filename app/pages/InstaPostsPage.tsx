// "use client";

// import { useEffect, useState } from "react";
// import { getInstaPosts, createInstaPost, updateInstaPost, deleteInstaPost } from "../api/instaposts";
// import type { InstaPost } from "../types";
// import Modal from "../components/ui/Modal";
// import { Plus, Trash2, ExternalLink, Check } from "lucide-react";
// import toast from "react-hot-toast";

// export default function InstaPostsPage() {
//   const [posts, setPosts] = useState<InstaPost[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [showAdd, setShowAdd] = useState(false);
//   const [url, setUrl] = useState("");
//   const [sortOrder, setSortOrder] = useState(0);
//   const [saving, setSaving] = useState(false);
//   const [deleteId, setDeleteId] = useState<number | null>(null);
//   const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
//   const [editingOrderValue, setEditingOrderValue] = useState(0);

//   const fetchPosts = () => {
//     setLoading(true);
//     getInstaPosts()
//       .then((res) => setPosts(res.data.items))
//       .catch(() => toast.error("Failed to load posts"))
//       .finally(() => setLoading(false));
//   };

//   useEffect(() => {
//     fetchPosts();
//   }, []);

//   const handleAdd = async () => {
//     if (!url.trim()) {
//       toast.error("Please enter a URL");
//       return;
//     }
//     setSaving(true);
//     try {
//       await createInstaPost(url.trim(), sortOrder);
//       toast.success("Post added");
//       setUrl("");
//       setSortOrder(0);
//       setShowAdd(false);
//       fetchPosts();
//     } catch {
//       toast.error("Failed to add post");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleOrderSave = async (id: number) => {
//     try {
//       await updateInstaPost(id, editingOrderValue);
//       toast.success("Order updated");
//       setEditingOrderId(null);
//       fetchPosts();
//     } catch {
//       toast.error("Failed to update order");
//     }
//   };

//   const handleDelete = async () => {
//     if (!deleteId) return;
//     try {
//       await deleteInstaPost(deleteId);
//       toast.success("Post deleted");
//       fetchPosts();
//     } catch {
//       toast.error("Failed to delete post");
//     }
//     setDeleteId(null);
//   };

//   return (
//     <div>
//       <div className="flex items-center justify-between mb-6">
//         <h2 className="text-2xl font-bold text-gray-800">Instagram Posts</h2>
//         <button
//           onClick={() => setShowAdd(true)}
//           className="flex items-center gap-2 bg-[#457e7f] text-white px-4 py-2 rounded-lg hover:bg-[#3a6b6c] transition-colors cursor-pointer"
//         >
//           <Plus size={18} />
//           Add Post
//         </button>
//       </div>

//       <div className="bg-white rounded-xl shadow-sm overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full text-left">
//             <thead className="bg-gray-50 border-b border-gray-200">
//               <tr>
//                 <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Order</th>
//                 <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Post URL</th>
//                 <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Added On</th>
//                 <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-100">
//               {loading ? (
//                 <tr>
//                   <td colSpan={4} className="px-6 py-10 text-center text-gray-400">Loading...</td>
//                 </tr>
//               ) : posts.length === 0 ? (
//                 <tr>
//                   <td colSpan={4} className="px-6 py-10 text-center text-gray-400">No posts added yet</td>
//                 </tr>
//               ) : (
//                 posts.map((p) => (
//                   <tr key={p.id} className="hover:bg-gray-50">
//                     <td className="px-6 py-4 text-sm text-gray-500">
//                       {editingOrderId === p.id ? (
//                         <div className="flex items-center gap-1">
//                           <input
//                             type="number"
//                             value={editingOrderValue}
//                             onChange={(e) => setEditingOrderValue(Number(e.target.value))}
//                             className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-1 focus:ring-[#457e7f]"
//                             autoFocus
//                             onKeyDown={(e) => {
//                               if (e.key === "Enter") handleOrderSave(p.id);
//                               if (e.key === "Escape") setEditingOrderId(null);
//                             }}
//                           />
//                           <button
//                             onClick={() => handleOrderSave(p.id)}
//                             className="p-1 text-green-600 hover:bg-green-50 rounded cursor-pointer"
//                           >
//                             <Check size={16} />
//                           </button>
//                         </div>
//                       ) : (
//                         <span
//                           onClick={() => {
//                             setEditingOrderId(p.id);
//                             setEditingOrderValue(p.sort_order);
//                           }}
//                           className="cursor-pointer hover:text-[#457e7f] font-medium"
//                           title="Click to edit order"
//                         >
//                           {p.sort_order}
//                         </span>
//                       )}
//                     </td>
//                     <td className="px-6 py-4 text-sm">
//                       <a
//                         href={p.post_url}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         className="text-blue-600 hover:underline flex items-center gap-1 max-w-md truncate"
//                       >
//                         {p.post_url}
//                         <ExternalLink size={14} />
//                       </a>
//                     </td>
//                     <td className="px-6 py-4 text-sm text-gray-500">
//                       {new Date(p.created_at).toLocaleDateString()}
//                     </td>
//                     <td className="px-6 py-4">
//                       <button
//                         onClick={() => setDeleteId(p.id)}
//                         className="p-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
//                       >
//                         <Trash2 size={16} />
//                       </button>
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Add Post Modal */}
//       <Modal open={showAdd} onClose={() => { setShowAdd(false); setUrl(""); setSortOrder(0); }}>
//         <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Instagram Post</h3>
//         <div className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Post URL</label>
//             <input
//               type="url"
//               value={url}
//               onChange={(e) => setUrl(e.target.value)}
//               placeholder="https://www.instagram.com/p/..."
//               className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#457e7f] focus:border-transparent"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
//             <input
//               type="number"
//               value={sortOrder}
//               onChange={(e) => setSortOrder(Number(e.target.value))}
//               className="w-32 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#457e7f] focus:border-transparent"
//             />
//           </div>
//           <div className="flex justify-end gap-3">
//             <button
//               onClick={() => { setShowAdd(false); setUrl(""); setSortOrder(0); }}
//               className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
//             >
//               Cancel
//             </button>
//             <button
//               onClick={handleAdd}
//               disabled={saving}
//               className="px-4 py-2 bg-[#457e7f] text-white rounded-lg hover:bg-[#3a6b6c] transition-colors disabled:opacity-50 cursor-pointer"
//             >
//               {saving ? "Saving..." : "Save"}
//             </button>
//           </div>
//         </div>
//       </Modal>

//       {/* Delete Confirmation */}
//       <Modal open={deleteId !== null} onClose={() => setDeleteId(null)}>
//         <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Post</h3>
//         <p className="text-gray-500 mb-6">Are you sure you want to delete this post?</p>
//         <div className="flex justify-end gap-3">
//           <button
//             onClick={() => setDeleteId(null)}
//             className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handleDelete}
//             className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer"
//           >
//             Delete
//           </button>
//         </div>
//       </Modal>
//     </div>
//   );
// }