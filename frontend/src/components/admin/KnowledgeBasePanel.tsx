import { useEffect, useState } from 'react';
import { kbAPI } from '@/lib/kbApi';
import type { KBArticle, KBRuleReference } from '@/types/KnowledgeBase';

type KBView = 'articles' | 'rules';

/**
 * Standalone Knowledge Base panel for the StaffPortal.
 * Browse/search articles and rule references — unlike ContextualHelp,
 * this is not tied to a specific workflow stage.
 */
export default function KnowledgeBasePanel() {
  const [view, setView] = useState<KBView>('articles');
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [rules, setRules] = useState<KBRuleReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        if (view === 'articles') {
          const data = searchQuery
            ? await kbAPI.searchArticles(searchQuery)
            : await kbAPI.listArticles();
          setArticles(data || []);
        } else {
          const data = await kbAPI.listRules();
          setRules(data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load KB data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [view, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Knowledge Base</h2>
          <p className="text-sm text-gray-500">Browse articles, rules, and reference material</p>
        </div>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => { setView('articles'); setExpandedId(null); }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              view === 'articles' ? 'bg-iw-sage text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Articles
          </button>
          <button
            onClick={() => { setView('rules'); setExpandedId(null); }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              view === 'rules' ? 'bg-iw-sage text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Rules
          </button>
        </div>
      </div>

      {/* Search (articles only) */}
      {view === 'articles' && (
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles..."
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pl-10 text-sm focus:border-iw-sage focus:ring-1 focus:ring-iw-sage outline-none"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{'\ud83d\udd0d'}</span>
        </div>
      )}

      {/* Loading / Error */}
      {loading && (
        <div className="p-6 text-center text-gray-500">
          Loading knowledge base...
        </div>
      )}

      {error && (
        <div className="p-6 text-center text-red-500">
          {error}
        </div>
      )}

      {/* Articles list */}
      {!loading && !error && view === 'articles' && (
        <div className="space-y-3">
          {articles.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              {searchQuery ? 'No articles match your search.' : 'No articles available.'}
            </div>
          ) : (
            articles.map((article) => (
              <div
                key={article.articleId}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(expandedId === article.articleId ? null : article.articleId)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{article.title}</span>
                      {article.stageId && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-200">
                          {article.stageId}
                        </span>
                      )}
                      {article.topic && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                          {article.topic}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{article.context}</p>
                  </div>
                  <span className="text-gray-400 text-xs ml-2">
                    {expandedId === article.articleId ? '\u25b2' : '\u25bc'}
                  </span>
                </button>

                {expandedId === article.articleId && (
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
                    {/* Context */}
                    <p className="text-sm text-gray-700 leading-relaxed pt-3">{article.context}</p>

                    {/* Checklist */}
                    {article.checklist && article.checklist.length > 0 && (
                      <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                        <div className="text-xs font-bold text-teal-700 mb-1.5">{'\u2713'} Checklist</div>
                        <ul className="space-y-1">
                          {article.checklist.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-teal-800">
                              <span className="text-teal-400 mt-0.5">{'\u2022'}</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Rules */}
                    {article.rules && article.rules.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="text-xs font-bold text-blue-700 mb-1.5">{'\ud83d\udcd6'} Rule References</div>
                        <div className="space-y-1">
                          {article.rules.map((rule, i) => (
                            <div key={i} className="text-xs text-blue-800">
                              <span className="font-semibold">{rule.code}</span>
                              <span className="text-blue-600"> {'\u2014'} {rule.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Next action */}
                    {article.nextAction && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div className="text-xs font-bold text-amber-700 mb-1">{'\u26a1'} Recommended Action</div>
                        <p className="text-xs text-amber-800">{article.nextAction}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Rules list */}
      {!loading && !error && view === 'rules' && (
        <div className="space-y-3">
          {rules.length === 0 ? (
            <div className="p-6 text-center text-gray-400">No rules available.</div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Code</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Description</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Domain</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => (
                    <tr key={rule.referenceId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-mono text-xs font-semibold text-blue-700">{rule.code}</td>
                      <td className="px-4 py-2.5 text-gray-700">{rule.description}</td>
                      <td className="px-4 py-2.5">
                        {rule.domain && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                            {rule.domain}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
