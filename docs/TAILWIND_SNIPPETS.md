# 🎨 Quick Reference - Tailwind CSS Snippets

## Common Component Styles

### 1. Modern Card
```jsx
<div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 
                hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
  {/* Card content */}
</div>
```

### 2. Gradient Card with Accent
```jsx
<div className="bg-gradient-to-br from-blue-50 to-indigo-50 
                rounded-2xl shadow-lg p-6 border border-blue-200 
                hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
  {/* Card content */}
</div>
```

### 3. Primary Button
```jsx
<button className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 
                   text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 
                   transition-all shadow-sm hover:shadow-md text-sm font-semibold">
  Button Text
</button>
```

### 4. Secondary Button
```jsx
<button className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg 
                   text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 
                   transition-all shadow-sm hover:shadow-md">
  Button Text
</button>
```

### 5. Status Badge with Pulse
```jsx
<span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full 
                 text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">
  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
  Completed
</span>
```

### 6. Category Badge
```jsx
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md 
                 text-xs font-medium border bg-indigo-50 text-indigo-700 border-indigo-200">
  <span className="text-sm">👤</span>
  Customer
</span>
```

### 7. Search Input with Icon
```jsx
<div className="relative">
  <input
    type="text"
    placeholder="Search..."
    className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl 
               focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
  />
  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">
    🔎
  </span>
</div>
```

### 8. Select Dropdown
```jsx
<select className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl 
                   bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
  <option>Option 1</option>
  <option>Option 2</option>
</select>
```

### 9. Avatar Circle
```jsx
<div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 
                flex items-center justify-center text-white font-bold text-sm">
  {initial}
</div>
```

### 10. Filter Chip
```jsx
<span className="inline-flex items-center gap-1 px-3 py-1 
                 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
  Active Filter
  <button className="ml-1 hover:text-blue-900">✕</button>
</span>
```

### 11. Table Container
```jsx
<div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
  <table className="min-w-full divide-y divide-gray-200">
    {/* Table content */}
  </table>
</div>
```

### 12. Table Header
```jsx
<thead className="bg-gray-50">
  <tr>
    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 
                   uppercase tracking-wider">
      Column Name
    </th>
  </tr>
</thead>
```

### 13. Table Row with Hover
```jsx
<tr className="hover:bg-blue-50 transition-colors duration-150 cursor-pointer group">
  <td className="px-6 py-4 whitespace-nowrap">
    {/* Cell content */}
  </td>
</tr>
```

### 14. Empty State
```jsx
<div className="flex flex-col items-center justify-center py-16">
  <div className="text-6xl mb-4">📭</div>
  <h3 className="text-xl font-semibold text-gray-700 mb-2">No items found</h3>
  <p className="text-gray-500">Try adjusting your filters</p>
</div>
```

### 15. Loading Spinner
```jsx
<div className="flex items-center justify-center">
  <div className="animate-spin rounded-full h-16 w-16 border-4 
                  border-blue-500 border-t-transparent"></div>
</div>
```

### 16. Loading with Text
```jsx
<div className="text-center">
  <div className="animate-spin rounded-full h-16 w-16 border-4 
                  border-blue-500 border-t-transparent mx-auto mb-4"></div>
  <p className="text-gray-600 font-medium">Loading...</p>
</div>
```

### 17. Page Header
```jsx
<div className="mb-8">
  <div className="flex items-center justify-between mb-2">
    <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
      <span className="text-5xl">📊</span>
      <span className="bg-gradient-to-r from-blue-600 to-indigo-600 
                       bg-clip-text text-transparent">
        Page Title
      </span>
    </h1>
  </div>
  <p className="text-gray-600 text-lg">Page description text</p>
</div>
```

### 18. Stats Card
```jsx
<div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl 
                shadow-lg p-6 border border-emerald-200 
                hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-emerald-700 uppercase tracking-wide mb-1">
        Label
      </p>
      <p className="text-3xl font-bold text-emerald-600">1,234</p>
      <p className="text-xs text-emerald-600 mt-1">Description</p>
    </div>
    <div className="text-5xl">✅</div>
  </div>
</div>
```

### 19. Pagination
```jsx
<div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 
                flex items-center justify-between border-t border-gray-200">
  <div className="flex items-center gap-2">
    <span className="text-sm font-medium text-gray-700">
      Showing <span className="font-bold text-blue-600">1</span> to{' '}
      <span className="font-bold text-blue-600">10</span> of{' '}
      <span className="font-bold text-gray-900">100</span> results
    </span>
  </div>
  <div className="flex gap-2">
    <button className="px-5 py-2.5 border-2 border-gray-300 rounded-lg text-sm 
                       font-semibold text-gray-700 bg-white hover:bg-gray-50 
                       hover:border-gray-400 transition-all shadow-sm hover:shadow-md">
      ← Previous
    </button>
    <button className="px-5 py-2.5 border-2 border-gray-300 rounded-lg text-sm 
                       font-semibold text-gray-700 bg-white hover:bg-gray-50 
                       hover:border-gray-400 transition-all shadow-sm hover:shadow-md">
      Next →
    </button>
  </div>
</div>
```

### 20. Alert/Notice
```jsx
<!-- Success -->
<div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4">
  <p className="text-emerald-700 font-medium">Success message</p>
</div>

<!-- Error -->
<div className="bg-rose-50 border-2 border-rose-200 rounded-xl p-4">
  <p className="text-rose-700 font-medium">Error message</p>
</div>

<!-- Warning -->
<div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
  <p className="text-amber-700 font-medium">Warning message</p>
</div>

<!-- Info -->
<div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
  <p className="text-blue-700 font-medium">Info message</p>
</div>
```

### 21. Link Button
```jsx
<Link 
  to="/path"
  className="inline-flex items-center gap-1 px-3 py-1.5 
             bg-gradient-to-r from-blue-500 to-indigo-500 text-white 
             rounded-lg hover:from-blue-600 hover:to-indigo-600 
             transition-all shadow-sm hover:shadow-md text-xs font-semibold">
  <span>💼</span>
  <span>Link Text</span>
</Link>
```

### 22. Icon Button
```jsx
<button className="p-2 rounded-lg bg-white border-2 border-gray-300 
                   hover:bg-gray-50 hover:border-gray-400 transition-all">
  <span className="text-xl">🔄</span>
</button>
```

### 23. Filter Section
```jsx
<div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
  <div className="flex items-center gap-2 mb-4">
    <span className="text-2xl">🔍</span>
    <h2 className="text-lg font-bold text-gray-800">Filters</h2>
  </div>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {/* Filter inputs */}
  </div>
</div>
```

### 24. Modal/Dialog Background
```jsx
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full mx-4">
    {/* Modal content */}
  </div>
</div>
```

### 25. Tooltip
```jsx
<div className="relative group">
  <button>Hover me</button>
  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
                  px-3 py-2 bg-gray-900 text-white text-xs rounded-lg 
                  opacity-0 group-hover:opacity-100 transition-opacity 
                  pointer-events-none whitespace-nowrap">
    Tooltip text
  </div>
</div>
```

---

## Color Combinations

### Status Colors
```jsx
// Pending
"bg-amber-50 text-amber-700 border-amber-200"

// Processing
"bg-blue-50 text-blue-700 border-blue-200"

// Completed
"bg-emerald-50 text-emerald-700 border-emerald-200"

// Failed
"bg-rose-50 text-rose-700 border-rose-200"

// Info
"bg-sky-50 text-sky-700 border-sky-200"
```

### Category Colors
```jsx
// Customer
"bg-indigo-50 text-indigo-700 border-indigo-200"

// Supplier
"bg-orange-50 text-orange-700 border-orange-200"

// Agent
"bg-cyan-50 text-cyan-700 border-cyan-200"

// Finance
"bg-green-50 text-green-700 border-green-200"
```

---

## Gradient Combinations

```jsx
// Blue gradient
"bg-gradient-to-r from-blue-500 to-indigo-500"

// Green gradient
"bg-gradient-to-r from-emerald-500 to-teal-500"

// Purple gradient
"bg-gradient-to-r from-violet-500 to-purple-500"

// Orange gradient
"bg-gradient-to-r from-orange-500 to-red-500"

// Background gradients
"bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"
"bg-gradient-to-br from-white to-gray-50"
```

---

## Responsive Patterns

```jsx
// Responsive grid
"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"

// Responsive padding
"p-4 md:p-6 lg:p-8"

// Responsive text
"text-sm md:text-base lg:text-lg"

// Responsive flex
"flex-col md:flex-row"
```

---

## Animation Classes

```jsx
// Spin
"animate-spin"

// Pulse
"animate-pulse"

// Bounce
"animate-bounce"

// Transition all
"transition-all duration-300"

// Transition colors
"transition-colors duration-150"

// Transform on hover
"transform hover:-translate-y-1 hover:scale-105"
```

---

## Copy-Paste Ready Examples

### Complete Stats Card
```jsx
<div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl shadow-lg p-6 border border-emerald-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-emerald-700 uppercase tracking-wide mb-1">Completed</p>
      <p className="text-3xl font-bold text-emerald-600">1,234</p>
      <p className="text-xs text-emerald-600 mt-1">Successfully processed</p>
    </div>
    <div className="text-5xl">✅</div>
  </div>
</div>
```

### Complete Search Bar
```jsx
<div className="relative">
  <input
    type="text"
    placeholder="Search by subject, sender, or customer name..."
    className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
  />
  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">🔎</span>
  <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
    ✕
  </button>
</div>
```

### Complete Table
```jsx
<div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
  <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
    <h2 className="text-lg font-bold text-gray-800">Table Title</h2>
  </div>
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Column 1</th>
          <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Column 2</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-100">
        <tr className="hover:bg-blue-50 transition-colors duration-150 cursor-pointer">
          <td className="px-6 py-4 whitespace-nowrap">Data 1</td>
          <td className="px-6 py-4 whitespace-nowrap">Data 2</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

---

Save this file for quick reference when building new components!
