type Tab = 'holdings' | 'performance' | 'weighting';

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
        <button
          className={activeTab === 'weighting' ? 'active' : ''}
          onClick={() => onSelect('weighting')}
        >
          EW vs. VW
        </button>
      </div>
    </div>
  );
}
