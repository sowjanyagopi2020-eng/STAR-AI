import React, { useState } from 'react';
import { Library, Book, Search, Plus, CheckCircle2, RotateCcw, BookmarkPlus } from 'lucide-react';
import { LibraryBook } from '../../types/school.ts';
import { Badge } from '../common/Badge.tsx';
import { Modal } from '../common/Modal.tsx';

interface LibraryViewProps {
  books: LibraryBook[];
}

export const LibraryView: React.FC<LibraryViewProps> = ({ books: initialBooks }) => {
  const [books, setBooks] = useState<LibraryBook[]>(initialBooks);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setBannerNotice(msg);
    setTimeout(() => setBannerNotice(null), 3500);
  };

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '978-0',
    category: 'Computer Science',
    totalCopies: 5,
    rackLocation: 'Shelf CS-01',
  });

  const categories = ['All', ...Array.from(new Set(books.map(b => b.category)))];

  const filteredBooks = books.filter(b => {
    const matchesSearch =
      searchTerm === '' ||
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.isbn.includes(searchTerm);
    const matchesCat = selectedCategory === 'All' || b.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleIssueBook = (id: string) => {
    setBooks(prev =>
      prev.map(b => {
        if (b.id === id && b.availableCopies > 0) {
          const nextAvail = b.availableCopies - 1;
          return {
            ...b,
            availableCopies: nextAvail,
            status: nextAvail === 0 ? 'Out of Stock' : 'Available',
          };
        }
        return b;
      })
    );
    showNotice('Book issued to active scholar! Due in 14 days.');
  };

  const handleReturnBook = (id: string) => {
    setBooks(prev =>
      prev.map(b => {
        if (b.id === id && b.availableCopies < b.totalCopies) {
          return {
            ...b,
            availableCopies: b.availableCopies + 1,
            status: 'Available',
          };
        }
        return b;
      })
    );
    showNotice('Book returned and checked back into circulation inventory.');
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.author) return;
    const newBook: LibraryBook = {
      id: `bk-${Date.now()}`,
      title: formData.title,
      author: formData.author,
      isbn: formData.isbn,
      category: formData.category,
      totalCopies: Number(formData.totalCopies),
      availableCopies: Number(formData.totalCopies),
      rackLocation: formData.rackLocation,
      status: 'Available',
    };
    setBooks([newBook, ...books]);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {bannerNotice && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-medium">
          {bannerNotice}
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Library Sciences & Media Center
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            ISBN cataloging, circulation ledger, barcode verification, and resource availability.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Catalog Title</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by title, author, or ISBN..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
        >
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Books Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase text-slate-500">
            <tr>
              <th className="py-3 px-4">Catalog Title & Author</th>
              <th className="py-3 px-4">ISBN</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Inventory</th>
              <th className="py-3 px-4">Shelf Location</th>
              <th className="py-3 px-4 text-right">Circulation Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredBooks.map(book => (
              <tr key={book.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                <td className="py-3 px-4">
                  <p className="font-semibold text-slate-900 dark:text-white">{book.title}</p>
                  <p className="text-[11px] text-slate-500">{book.author}</p>
                </td>
                <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{book.isbn}</td>
                <td className="py-3 px-4">
                  <Badge variant="neutral">{book.category}</Badge>
                </td>
                <td className="py-3 px-4 font-mono tabular-nums">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {book.availableCopies}
                  </span>
                  <span className="text-slate-400"> / {book.totalCopies} available</span>
                </td>
                <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{book.rackLocation}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleIssueBook(book.id)}
                      disabled={book.availableCopies === 0}
                      className="px-2.5 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded transition-colors"
                    >
                      Issue Book
                    </button>
                    <button
                      onClick={() => handleReturnBook(book.id)}
                      disabled={book.availableCopies === book.totalCopies}
                      className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-300 rounded transition-colors"
                    >
                      Return
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Book Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Library Book"
        subtitle="Registers ISBN into media catalog"
      >
        <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Book Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Author *</label>
              <input
                type="text"
                required
                value={formData.author}
                onChange={e => setFormData({ ...formData, author: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Total Copies</label>
              <input
                type="number"
                min={1}
                value={formData.totalCopies}
                onChange={e => setFormData({ ...formData, totalCopies: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Rack / Shelf</label>
              <input
                type="text"
                value={formData.rackLocation}
                onChange={e => setFormData({ ...formData, rackLocation: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg"
            >
              Save Title
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
