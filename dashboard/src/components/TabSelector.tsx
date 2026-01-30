type Tab = 'holdings' | 'performance';

interface TabSelectorProps {
  activeTab: Tab;
  onSelect: (tab: Tab) => void;
}

export function TabSelector({ activeTab, onSelect }: TabSelectorProps) {
  return (
    <div className="container">
      <div className="tab-selector">
        <button
          className={activeTab === 'holdings' ? 'active' : ''}
          onClick={() => onSelect('holdings')}
        >
          Holdings
        </button>
        <button
          className={activeTab === 'performance' ? 'active' : ''}
          onClick={() => onSelect('performance')}
        >
          Performance
        </button>
      </div>
    </div>
  );
}
