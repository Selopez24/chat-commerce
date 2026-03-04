import { useState, useEffect } from 'react';
import { ChatWidget } from './components/ChatWidget';

interface Business {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  welcomeMessage: string | null;
  quickReplies: string[];
}

interface IngestResult {
  source: string;
  chunksAdded: number;
  pagesScraped: number;
}

const API_URL = 'http://localhost:3001';

function App() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [newBusinessName, setNewBusinessName] = useState('');
  const [newBusinessSlug, setNewBusinessSlug] = useState('');
  const [newBusinessDesc, setNewBusinessDesc] = useState('');
  const [newBusinessUrl, setNewBusinessUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [scrapeStatus, setScrapeStatus] = useState<string | null>(null);
  const [scrapeProgress, setScrapeProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchBusinesses = async () => {
    try {
      const response = await fetch(`${API_URL}/businesses`);
      if (response.ok) {
        const data = (await response.json()) as Business[];
        setBusinesses(data);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch businesses:', err);
    }
  };

  useEffect(() => {
    void fetchBusinesses();
  }, []);

  const createBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBusinessName || !newBusinessSlug) return;

    setLoading(true);
    setError(null);
    setScrapeStatus(null);
    setScrapeProgress(null);

    try {
      const response = await fetch(`${API_URL}/businesses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newBusinessName,
          slug: newBusinessSlug,
          description: newBusinessDesc || undefined,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { message?: string };
        setError(data.message ?? 'Failed to create business');
        setLoading(false);
        return;
      }

      const newBusiness = (await response.json()) as Business;
      setScrapeProgress('Business created. Starting scrape...');

      if (newBusinessUrl) {
        setScrapeStatus('scraping');
        const scrapeResponse = await fetch(`${API_URL}/ingestion/url/${newBusiness.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: newBusinessUrl,
            maxDepth: 0,
            maxPages: 1,
          }),
        });

        if (!scrapeResponse.ok) {
          const scrapeError = (await scrapeResponse.json()) as {
            message?: string;
          };
          setScrapeStatus('failed');
          setScrapeProgress(null);
          setError(
            `Business created but scraping failed: ${scrapeError.message || 'Unknown error'}. Business has been deleted.`,
          );
          await deleteBusiness(newBusiness.id, false);
          setLoading(false);
          return;
        }

        const scrapeResult = (await scrapeResponse.json()) as IngestResult;
        setScrapeProgress(
          `Scraped ${scrapeResult.pagesScraped} page(s), added ${scrapeResult.chunksAdded} chunk(s).`,
        );

        if (scrapeResult.chunksAdded === 0) {
          setScrapeStatus('no-content');
          setError('Scraping completed but no content was extracted. Business has been deleted.');
          await deleteBusiness(newBusiness.id, false);
          setLoading(false);
          return;
        }

        setScrapeStatus('success');
      } else {
        setScrapeStatus('no-url');
        setError(
          'Business created but no URL was provided for scraping. Please add a URL to scrape content.',
        );
        await deleteBusiness(newBusiness.id, false);
        setLoading(false);
        return;
      }

      setNewBusinessName('');
      setNewBusinessSlug('');
      setNewBusinessDesc('');
      setNewBusinessUrl('');
      void fetchBusinesses();
    } catch (err) {
      setError('Failed to create business');
    } finally {
      setLoading(false);
    }
  };

  const deleteBusiness = async (businessId: string, refreshList = true) => {
    try {
      await fetch(`${API_URL}/businesses/${businessId}`, {
        method: 'DELETE',
      });
      if (refreshList) {
        void fetchBusinesses();
        if (selectedBusiness?.id === businessId) {
          setSelectedBusiness(null);
        }
      }
    } catch {
      setError('Failed to delete business');
    }
  };

  return (
    <div
      style={{
        padding: '40px',
        fontFamily: 'system-ui, sans-serif',
        maxWidth: '800px',
        margin: '0 auto',
      }}
    >
      <h1>Chat Commerce Demo</h1>
      <p>This is a demo page for the Chat Widget.</p>

      <div
        style={{
          marginTop: '32px',
          padding: '24px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          backgroundColor: '#f9f9f9',
        }}
      >
        <h2 style={{ marginTop: 0 }}>Dev Panel</h2>

        <div style={{ marginBottom: '24px' }}>
          <h3>Select a Business</h3>
          {businesses.length === 0 ? (
            <p style={{ color: '#666' }}>No businesses found. Create one below.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {businesses.map((biz) => (
                <div
                  key={biz.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <button
                    onClick={() => setSelectedBusiness(biz)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '4px',
                      border:
                        selectedBusiness?.id === biz.id ? '2px solid #007bff' : '1px solid #ccc',
                      backgroundColor: selectedBusiness?.id === biz.id ? '#e6f0ff' : 'white',
                      cursor: 'pointer',
                    }}
                  >
                    {biz.name}
                  </button>
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          `Are you sure you want to delete "${biz.name}"? This will also delete all chat history and knowledge base.`,
                        )
                      ) {
                        void deleteBusiness(biz.id);
                      }
                    }}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #dc3545',
                      backgroundColor: '#fff',
                      color: '#dc3545',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                    title="Delete business"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ borderTop: '1px solid #ddd', paddingTop: '24px', marginTop: '24px' }}>
          <h3>Create New Business</h3>
          <form
            onSubmit={createBusiness}
            style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '400px' }}
          >
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                Name *
              </label>
              <input
                type="text"
                value={newBusinessName}
                onChange={(e) => setNewBusinessName(e.target.value)}
                placeholder="My Business"
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                Slug *
              </label>
              <input
                type="text"
                value={newBusinessSlug}
                onChange={(e) =>
                  setNewBusinessSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))
                }
                placeholder="my-business"
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                Description
              </label>
              <textarea
                value={newBusinessDesc}
                onChange={(e) => setNewBusinessDesc(e.target.value)}
                placeholder="A brief description of your business..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                Website URL to Scrape *
              </label>
              <input
                type="url"
                value={newBusinessUrl}
                onChange={(e) => setNewBusinessUrl(e.target.value)}
                placeholder="https://example.com"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                }}
              />
              <small style={{ color: '#666', display: 'block', marginTop: '4px' }}>
                Required. The website will be scraped to create knowledge base.
              </small>
            </div>
            {scrapeProgress && (
              <div
                style={{
                  padding: '8px',
                  backgroundColor: '#e8f4fd',
                  borderRadius: '4px',
                  color: '#0066cc',
                }}
              >
                {scrapeProgress}
              </div>
            )}
            {scrapeStatus === 'success' && (
              <div
                style={{
                  padding: '8px',
                  backgroundColor: '#d4edda',
                  borderRadius: '4px',
                  color: '#155724',
                }}
              >
                Scraping completed successfully!
              </div>
            )}
            {error && <p style={{ color: 'red', margin: 0 }}>{error}</p>}
            <button
              type="submit"
              disabled={loading || !newBusinessName || !newBusinessSlug || !newBusinessUrl}
              style={{
                padding: '10px 20px',
                backgroundColor:
                  loading || !newBusinessName || !newBusinessSlug || !newBusinessUrl
                    ? '#ccc'
                    : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor:
                  loading || !newBusinessName || !newBusinessSlug || !newBusinessUrl
                    ? 'not-allowed'
                    : 'pointer',
              }}
            >
              {loading ? 'Creating & Scraping...' : 'Create Business & Scrape'}
            </button>
          </form>
        </div>
      </div>

      {selectedBusiness && (
        <div
          style={{
            marginTop: '32px',
            padding: '24px',
            border: '1px solid #4caf50',
            borderRadius: '8px',
            backgroundColor: '#f0fdf4',
          }}
        >
          <h2 style={{ marginTop: 0, color: '#4caf50' }}>Active: {selectedBusiness.name}</h2>
          <p>
            <strong>ID:</strong> {selectedBusiness.id}
          </p>
          <p>
            <strong>Slug:</strong> {selectedBusiness.slug}
          </p>
          {selectedBusiness.description && (
            <p>
              <strong>Description:</strong> {selectedBusiness.description}
            </p>
          )}

          <ChatWidget
            config={{
              businessId: selectedBusiness.id,
              apiUrl: API_URL,
              primaryColor: '#007bff',
              position: 'bottom-right',
            }}
            title={`${selectedBusiness.name} Chat`}
            welcomeMessage={selectedBusiness.welcomeMessage || 'Hello! How can I help you today?'}
            quickReplies={
              selectedBusiness.quickReplies?.length
                ? selectedBusiness.quickReplies
                : ['What do you offer?', 'How can I contact you?']
            }
          />
        </div>
      )}
    </div>
  );
}

export default App;
