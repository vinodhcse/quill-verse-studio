export const SidebarChapterList = ({ chapters, activeId, onSelect }) => (
  <aside className="w-64 border-r overflow-auto">
    {chapters.map(ch => (
      <div
        key={ch.id}
        className={`p-3 cursor-pointer ${ch.id === activeId ? 'bg-gray-100' : ''}`}
        onClick={() => onSelect(ch.id)}
      >
        {ch.title}
      </div>
    ))}
  </aside>
);
