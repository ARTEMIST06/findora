import React, { useState, useEffect, useMemo } from 'react';
import { useFindoraStore } from '../../services/store';
import { ProductDraft } from '../../types';
import { Plus, Edit2, Trash2, Search, ExternalLink, Activity, CheckCircle, Package, Copy, Image as ImageIcon, ImageOff } from 'lucide-react';
import { DraftEditor } from './DraftEditor';
import { useToast } from '../../components/common/Toast';
import { TEAM_MEMBERS } from '../../config/teamMembers';
import { calculateDraftStatus, formatDraftStatus } from '../../utils/drafts';
import { OpenAmazonButton } from '../../components/admin/OpenAmazonButton';
import { AmazonQuickActions } from '../../components/admin/AmazonQuickActions';

export const DraftsDashboard: React.FC = () => {
  const store = useFindoraStore();
  const { showToast } = useToast();
  const [drafts, setDrafts] = useState<ProductDraft[]>([]);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'active' | 'ready' | 'published'>('active');
  const [filterAddedBy, setFilterAddedBy] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    const data = await store.getDrafts();
    
    // Normalize and migrate existing drafts
    const migrated = data.map(d => {
      let draftStatus = d.draftStatus;
      if (!draftStatus) {
         draftStatus = calculateDraftStatus(d);
      }
      return { ...d, draftStatus };
    });
    setDrafts(migrated);
  };

  const handleDuplicateDraft = async (d: ProductDraft) => {
    try {
      const newDraft = await store.duplicateDraft(d.id);
      if (newDraft) {
        showToast(`Draft duplicated as "${newDraft.title}"`, 'success');
        await loadDrafts();
      } else {
        showToast('Failed to duplicate draft', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error duplicating draft', 'error');
    }
  };

  const activeDrafts = drafts.filter(d => d.draftStatus !== 'ready_to_publish' && d.draftStatus !== 'published');
  const readyDrafts = drafts.filter(d => d.draftStatus === 'ready_to_publish');
  const publishedDrafts = drafts.filter(d => d.draftStatus === 'published');

  // Team Stats
  const teamStats = useMemo(() => {
    return TEAM_MEMBERS.map(member => {
      const memberDrafts = drafts.filter(d => d.addedByUserId === member.id);
      return {
        name: member.name,
        active: memberDrafts.filter(d => d.draftStatus !== 'ready_to_publish' && d.draftStatus !== 'published').length,
        ready: memberDrafts.filter(d => d.draftStatus === 'ready_to_publish').length,
        published: memberDrafts.filter(d => d.draftStatus === 'published').length
      };
    });
  }, [drafts]);

  const currentList = activeTab === 'active' ? activeDrafts : activeTab === 'ready' ? readyDrafts : publishedDrafts;
  
  const filteredList = currentList.filter(d => {
    if (filterAddedBy !== 'All' && d.addedByUserId !== filterAddedBy) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!d.title?.toLowerCase().includes(q) && !d.brand?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  if (editingDraftId) {
    return <DraftEditor draftId={editingDraftId} onBack={() => { setEditingDraftId(null); loadDrafts(); }} />;
  }

  return (
    <div className="space-y-6">
      
      {/* Team Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {teamStats.map(stat => (
          <div key={stat.name} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900">{stat.name}</h3>
              <p className="text-xs text-slate-500">Productivity Stats</p>
            </div>
            <div className="flex gap-3 text-center">
              <div>
                <div className="text-sm font-bold text-blue-600">{stat.active}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Active</div>
              </div>
              <div>
                <div className="text-sm font-bold text-green-600">{stat.ready}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Ready</div>
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">{stat.published}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Pub</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Draft Management</h2>
        <button
          onClick={() => setEditingDraftId('new')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Draft
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors ${activeTab === 'active' ? 'bg-blue-50 text-blue-700 border-blue-200 border' : 'bg-slate-50 text-slate-600 border border-transparent hover:bg-slate-100'}`}
          >
            <Activity className="w-4 h-4" />
            Active Drafts ({activeDrafts.length})
          </button>
          <button 
            onClick={() => setActiveTab('ready')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors ${activeTab === 'ready' ? 'bg-green-50 text-green-700 border-green-200 border' : 'bg-slate-50 text-slate-600 border border-transparent hover:bg-slate-100'}`}
          >
            <CheckCircle className="w-4 h-4" />
            Ready to Publish ({readyDrafts.length})
          </button>
          <button 
            onClick={() => setActiveTab('published')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors ${activeTab === 'published' ? 'bg-slate-900 text-white border-slate-900 border' : 'bg-slate-50 text-slate-600 border border-transparent hover:bg-slate-100'}`}
          >
            <Package className="w-4 h-4" />
            Published ({publishedDrafts.length})
          </button>
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search drafts..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-blue-500 text-sm w-48"
            />
          </div>
          <select value={filterAddedBy} onChange={e => setFilterAddedBy(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-blue-500 text-sm">
            <option value="All">All Authors</option>
            {TEAM_MEMBERS.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-4 font-bold">Product</th>
                <th className="px-4 py-4 font-bold">Brand</th>
                <th className="px-4 py-4 font-bold">Status</th>
                <th className="px-4 py-4 font-bold">Amazon</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {d.image ? (
                        <img
                          src={d.image}
                          alt={d.title || 'Product'}
                          className="w-10 h-10 object-contain rounded-lg border border-slate-200 bg-white shrink-0 p-0.5"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 text-slate-300">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 line-clamp-1">{d.title || 'Untitled Draft'}</div>
                        <div className="text-xs text-slate-400">
                          {d.category || 'No category'} • Added by: {d.addedBy || 'Unknown'} • Updated: {new Date(d.updatedAt || d.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-800 whitespace-nowrap">
                    {d.brand || '—'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                      d.draftStatus === 'published' ? 'bg-slate-100 text-slate-700' :
                      d.draftStatus === 'ready_to_publish' ? 'bg-green-100 text-green-700' :
                      'bg-blue-50 text-blue-700'
                    }`}>
                      {formatDraftStatus(d.draftStatus || 'incomplete')}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <AmazonQuickActions 
                      productUrl={d.productUrl} 
                      affiliateUrl={d.affiliateUrl} 
                      needsVerification={d.amazonNeedsVerification}
                      size="compact" 
                    />
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      <button
                        onClick={() => setEditingDraftId(d.id)}
                        className="px-2.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                        title="Edit draft details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleDuplicateDraft(d)}
                        className="px-2.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                        title="Duplicate as new draft"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Duplicate</span>
                      </button>
                      
                      {d.draftStatus === 'ready_to_publish' && (
                        <button
                          onClick={() => setEditingDraftId(d.id)}
                          className="px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-xs"
                          title="Review and publish draft"
                        >
                          <span>Review / Publish</span>
                        </button>
                      )}

                      {d.draftStatus === 'published' && (
                        <button
                          onClick={() => setEditingDraftId(d.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100"
                          title="View draft"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={async () => {
                          if (confirm('Delete this draft?')) {
                            await store.deleteDraft(d.id);
                            loadDrafts();
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition-colors rounded-md hover:bg-red-50"
                        title="Delete draft"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Package className="w-8 h-8 text-slate-300 mb-2" />
                      <p>No drafts found in this view.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
