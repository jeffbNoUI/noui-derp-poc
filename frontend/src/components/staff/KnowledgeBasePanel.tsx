import { useState, useEffect } from 'react';
import { kbAPI } from '@/lib/kbApi';
import type { KBArticle, KBRuleReference } from '@/types/KnowledgeBase';

const WORKFLOW_STAGES = [
  { id: 'intake', label: 'Application Intake' },
  { id: 'verify-docs', label: 'Document Verification' },
  { id: 'eligibility', label: 'Eligibility Review' },
  { id: 'salary-ams', label: 'Salary & AMS' },
  { id: 'benefit-calc', label: 'Benefit Calculation' },
  { id: 'election', label: 'Election Recording' },
  { id: 'dro-calc', label: 'DRO Calculation' },
  { id: 'certification', label: 'Certification' },
];

export default function KnowledgeBasePanel() {
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [rules, setRules] = useState<KBRuleReference[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'articles' | 'rules'>('articles');

  useEffect(() => {
    loadArticles();
    loadRules();
  }, []);

  async function loadArticles() {
    setLoading(true);
    setError(null);
    try {
      const data = await kbAPI.listArticles();
      setArticles(data || []);
    } catch {
      setError('Unable to load articles. Knowledge Base service may be offline.');
    } finally {
      setLoading(false);
    }
  }

  async function loadRules() {
    try {
      const data = await kbAPI.listRules();
      setRules(data || []);
    } catch {
      // Rules are secondary — don't block on failure
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) {
      loadArticles();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await kbAPI.searchArticles(searchQuery.trim());
      setArticles(data || []);
    } catch {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStageFilter(stageId: string) {
    setSelectedStage(stageId);
    setSelectedArticle(null);
    if (!stageId) {
      loadArticles();
      return;
    }
    setLoading(true);
    try {
      const data = await kbAPI.listArticles({ stage_id: stageId });
      setArticles(data || []);
    } catch {
      setError('Failed to filter articles.');
    } finally {
      setLoading(false);
    }
  }

  const filteredArticles = selectedStage
    ? articles.filter((a) => a.stageId === selectedStage)
    : articles;

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search articles and rules..."
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm pr-20 focus:border-iw-sage focus:ring-1 focus:ring-iw-sage outline-none"
          />
          <button
            onClick={handleSearch}
            className="absolute right-1.5 top-1.5 rounded bg-iw-sage px-3 py-1 text-xs font-medium text-white hover:bg-iw-sageDark transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setActiveSection('articles')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeSection === 'articles'
              ? 'border-iw-sage text-iw-sage'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Articles ({filteredArticles.length})
        </button>
        <button
          onClick={() => setActiveSection('rules')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeSection === 'rules'
              ? 'border-iw-sage text-iw-sage'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Rule References ({rules.length})
        </button>
      </div>

      {/* Articles section */}
      {activeSection === 'articles' && (
        <div className="flex gap-4">
          {/* Stage filter sidebar */}
          <div className="w-48 flex-shrink-0">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Filter by Stage
            </div>
            <button
              onClick={() => handleStageFilter('')}
              className={`w-full text-left px-3 py-1.5 text-xs rounded transition-colors ${
                !selectedStage ? 'bg-iw-sageLight/50 text-iw-sage font-medium' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              All Stages
            </button>
            {WORKFLOW_STAGES.map((stage) => (
              <button
                key={stage.id}
                onClick={() => handleStageFilter(stage.id)}
                className={`w-full text-left px-3 py-1.5 text-xs rounded transition-colors ${
                  selectedStage === stage.id
                    ? 'bg-iw-sageLight/50 text-iw-sage font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {stage.label}
              </button>
            ))}
          </div>

          {/* Article list / detail */}
          <div className="flex-1">
            {loading && (
              <div className="text-center text-sm text-gray-400 py-8">Loading articles...</div>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {!loading && !error && !selectedArticle && (
              <div className="space-y-2">
                {filteredArticles.length === 0 && (
                  <div className="text-center text-sm text-gray-400 py-8">
                    No articles found.
                  </div>
                )}
                {filteredArticles.map((article) => (
                  <button
                    key={article.articleId}
                    onClick={() => setSelectedArticle(article)}
                    className="w-full text-left bg-white rounded-lg border border-gray-200 p-4 hover:border-iw-sage/50 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">{article.title}</h3>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{article.context}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 flex-shrink-0 ml-2">
                        {article.stageId}
                      </span>
                    </div>
                    {article.rules && article.rules.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {article.rules.map((r) => (
                          <span key={r.referenceId} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200">
                            {r.code}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Article detail view */}
            {selectedArticle && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="text-xs text-gray-400 hover:text-gray-600 mb-4"
                >
                  {'\u2190'} Back to articles
                </button>

                <h2 className="text-lg font-bold text-gray-900 mb-1">{selectedArticle.title}</h2>
                <div className="flex gap-2 mb-4">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                    {selectedArticle.stageId}
                  </span>
                  {selectedArticle.topic && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-iw-sageLight text-iw-sage">
                      {selectedArticle.topic}
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-600 leading-relaxed mb-4">{selectedArticle.context}</p>

                {selectedArticle.checklist.length > 0 && (
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-4">
                    <h3 className="text-xs font-bold text-teal-700 mb-2">Checklist</h3>
                    <ul className="space-y-1">
                      {selectedArticle.checklist.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-teal-800">
                          <span className="text-teal-400 mt-0.5">{'•'}</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedArticle.rules && selectedArticle.rules.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h3 className="text-xs font-bold text-blue-700 mb-2">Rule References</h3>
                    <div className="space-y-1">
                      {selectedArticle.rules.map((rule) => (
                        <div key={rule.referenceId} className="text-xs text-blue-800">
                          <span className="font-semibold">{rule.code}</span>
                          <span className="text-blue-600"> — {rule.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedArticle.nextAction && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h3 className="text-xs font-bold text-amber-700 mb-2">Recommended Next Action</h3>
                    <p className="text-xs text-amber-800">{selectedArticle.nextAction}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rules section */}
      {activeSection === 'rules' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div className="col-span-2">Code</div>
            <div className="col-span-6">Description</div>
            <div className="col-span-2">Domain</div>
            <div className="col-span-2">Article</div>
          </div>
          {rules.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              No rule references available.
            </div>
          )}
          {rules.map((rule) => (
            <div
              key={rule.referenceId}
              className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-100 text-sm items-center"
            >
              <div className="col-span-2">
                <span className="font-mono text-xs font-semibold text-blue-700">{rule.code}</span>
              </div>
              <div className="col-span-6 text-xs text-gray-700">{rule.description}</div>
              <div className="col-span-2">
                {rule.domain && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {rule.domain}
                  </span>
                )}
              </div>
              <div className="col-span-2">
                <span className="text-[10px] font-mono text-gray-400">{rule.articleId}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
