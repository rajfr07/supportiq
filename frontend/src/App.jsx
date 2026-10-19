import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Headphones,
  LayoutDashboard,
  LoaderCircle,
  Menu,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Ticket,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "./api";
import "./App.css";

const CATEGORIES = [
  "Billing",
  "Technical Support",
  "Account Access",
  "Product",
  "Shipping",
  "Other",
];

const COLORS = {
  high: "#b7473d",
  medium: "#a66b24",
  low: "#176b56",
};

const CATEGORY_COLORS = [
  "#176b56",
  "#c18a43",
  "#557eaa",
  "#a76b60",
  "#7b75a8",
  "#89918a",
];

const NAVIGATION = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "tickets", label: "All tickets", icon: Ticket },
  { id: "open", label: "Open tickets", icon: Clock3 },
  { id: "resolved", label: "Resolved", icon: CheckCircle2 },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function Badge({ children, type = "neutral" }) {
  return <span className={`app-badge app-badge-${type}`}>{children}</span>;
}

function Metric({ label, value, detail, icon: Icon }) {
  return (
    <article className="app-metric">
      <div className="app-metric-heading">
        <span>{label}</span>
        <Icon size={18} />
      </div>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function TicketForm({ onClose, onCreate, submitting }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    category: "",
  });

  const [formError, setFormError] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [classifying, setClassifying] = useState(false);
  const [classificationError, setClassificationError] = useState("");

  function update(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setPrediction(null);
    setClassificationError("");
  }

  async function previewClassification() {
    if (form.title.trim().length < 3 || !form.description.trim()) {
      setClassificationError(
        "Enter a subject and description to classify the ticket."
      );
      setPrediction(null);
      return;
    }


    setClassifying(true);
    setClassificationError("");
    setPrediction(null);

    try {
      const result = await api.classifyTicket({
        title: form.title.trim(),
        description: form.description.trim(),
      });

      setPrediction(result);
    } catch (error) {
      setClassificationError(
        error.message || "Unable to classify this ticket."
      );
    } finally {
      setClassifying(false);
    }


  }

  async function submit(event) {
    event.preventDefault();
    setFormError("");


    if (form.title.trim().length < 3) {
      setFormError("The title must contain at least 3 characters.");
      return;
    }

    if (!form.description.trim()) {
      setFormError("Please describe the customer's issue.");
      return;
    }

    try {
      await onCreate({
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
      });

      onClose();
    } catch (error) {
      setFormError(error.message || "Unable to create the ticket.");
    }


  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    > <section
      className="ticket-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-ticket-heading"
    > <div className="modal-heading"> <div> <span className="eyebrow">SUPPORT OPERATIONS</span> <h2 id="create-ticket-heading">New ticket</h2> <p>Add a customer request to your support queue.</p> </div>

          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form className="ticket-form" onSubmit={submit}>
          <label>
            Subject
            <input
              name="title"
              value={form.title}
              onChange={update}
              placeholder="What does the customer need help with?"
              maxLength={200}
              required
            />
          </label>

          <label>
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={update}
              placeholder="Include the relevant details..."
              rows={5}
              required
            />
          </label>

          <div className="ai-classification-panel">
            <div>
              <span className="eyebrow">SUPPORTIQ AI</span>
              <h3>Automatic ticket classification</h3>
              <p>
                Predict the support category from the subject and description.
              </p>
            </div>

            <button
              type="button"
              className="button button-secondary"
              onClick={previewClassification}
              disabled={classifying}
            >
              {classifying ? (
                <LoaderCircle size={16} className="spin" />
              ) : (
                <Activity size={16} />
              )}
              {classifying ? "Analysing..." : "Predict category"}
            </button>

            {prediction && (
              <div className="ai-prediction-result">
                <CheckCircle2 size={18} />
                <div>
                  <strong>Predicted category: {prediction.category}</strong>
                  <p>
                    Matched keywords:{" "}
                    {Array.isArray(prediction.matched_keywords) &&
                      prediction.matched_keywords.length
                      ? prediction.matched_keywords.join(", ")
                      : "No matching keywords"}
                  </p>
                  <p>Classification method: Keyword-based baseline</p>
                </div>
              </div>
            )}

            {classificationError && (
              <div className="form-error">
                <AlertCircle size={16} />
                {classificationError}
              </div>
            )}
          </div>

          <div className="form-row">
            <label>
              Priority
              <select name="priority" value={form.priority} onChange={update}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>

            <label>
              Category
              <select name="category" value={form.category} onChange={update}>
                <option value="">AI auto-detect</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {formError && (
            <div className="form-error">
              <AlertCircle size={16} />
              {formError}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="button button-primary"
              disabled={submitting}
            >
              {submitting ? (
                <LoaderCircle size={16} className="spin" />
              ) : (
                <Plus size={16} />
              )}
              Create ticket
            </button>
          </div>
        </form>
      </section>
    </div>


  );
}


function TicketDetails({ ticket, onClose, onResolve, resolving }) {
  if (!ticket) return null;

  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        className="ticket-modal ticket-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ticket-detail-heading"
      >
        <div className="modal-heading">
          <div>
            <span className="eyebrow">TICKET #{ticket.id}</span>
            <h2 id="ticket-detail-heading">{ticket.title}</h2>
            <p>Created {formatDateTime(ticket.created_at)}</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="ticket-detail-badges">
          <Badge type={ticket.status === "closed" ? "green" : "orange"}>
            {ticket.status === "closed" ? "Resolved" : "Open"}
          </Badge>
          <Badge type={ticket.priority || "neutral"}>
            {ticket.priority || "Medium"} priority
          </Badge>
          <Badge>{ticket.category || "Uncategorized"}</Badge>
        </div>

        <div className="ticket-description">
          <h3>Issue description</h3>
          <p>{ticket.description || "No description provided."}</p>
        </div>

        {ticket.closed_at && (
          <p className="ticket-resolved-date">
            Resolved on {formatDateTime(ticket.closed_at)}
          </p>
        )}

        <div className="modal-actions">
          <button
            className="button button-secondary"
            onClick={onClose}
          >
            Close window
          </button>
          {ticket.status === "open" && (
            <button
              className="button button-primary"
              disabled={resolving}
              onClick={() => onResolve(ticket.id)}
            >
              {resolving ? (
                <LoaderCircle size={16} className="spin" />
              ) : (
                <Check size={16} />
              )}
              Mark resolved
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function TicketTable({
  tickets,
  loading,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  categoryFilter,
  setCategoryFilter,
  onSelect,
  onResolve,
  resolvingId,
  onCreate,
  showFilters = true,
}) {
  return (
    <>
      <div className="app-ticket-toolbar">
        <div className="app-search">
          <Search size={17} />
          <input
            type="search"
            placeholder="Search tickets, IDs or descriptions..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} aria-label="Clear search">
              <X size={15} />
            </button>
          )}
        </div>

        {showFilters && (
          <div className="app-filters">
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="closed">Resolved</option>
            </select>

            <select
              aria-label="Filter by priority"
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
            >
              <option value="all">All priorities</option>
              <option value="high">High priority</option>
              <option value="medium">Medium priority</option>
              <option value="low">Low priority</option>
            </select>

            <select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="all">All categories</option>
              {CATEGORIES.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="table-wrapper">
        <table className="tickets-table app-ticket-table">
          <thead>
            <tr>
              <th>SUBJECT</th>
              <th>CATEGORY</th>
              <th>PRIORITY</th>
              <th>STATUS</th>
              <th>CREATED</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="table-message">
                  <LoaderCircle size={22} className="spin" />
                  Loading tickets...
                </td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan="6" className="table-message">
                  <MessageSquare size={24} />
                  <strong>No tickets found</strong>
                  <span>Try adjusting your filters or create a ticket.</span>
                  <button
                    className="button button-primary empty-create-button"
                    onClick={onCreate}
                  >
                    <Plus size={16} />
                    New ticket
                  </button>
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td>
                    <button
                      type="button"
                      className="app-ticket-subject"
                      onClick={() => onSelect(ticket)}
                    >
                      <span className="app-ticket-id">#{ticket.id}</span>
                      <strong>{ticket.title}</strong>
                      <span className="app-ticket-description">
                        {(ticket.description || "").slice(0, 70)}
                        {(ticket.description || "").length > 70 ? "…" : ""}
                      </span>
                    </button>
                  </td>
                  <td>
                    <span className="category-tag">
                      {ticket.category || "Uncategorized"}
                    </span>
                  </td>
                  <td>
                    <Badge type={ticket.priority || "medium"}>
                      {ticket.priority || "Medium"}
                    </Badge>
                  </td>
                  <td>
                    <Badge type={ticket.status === "closed" ? "green" : "orange"}>
                      {ticket.status === "closed" ? "Resolved" : "Open"}
                    </Badge>
                  </td>
                  <td className="date-cell">{formatDate(ticket.created_at)}</td>
                  <td>
                    {ticket.status === "open" ? (
                      <button
                        type="button"
                        className="close-ticket-button"
                        disabled={resolvingId === ticket.id}
                        onClick={() => onResolve(ticket.id)}
                      >
                        {resolvingId === ticket.id ? (
                          <LoaderCircle size={15} className="spin" />
                        ) : (
                          <CheckCircle2 size={15} />
                        )}
                        Resolve
                      </button>
                    ) : (
                      <span className="completed-action">
                        <CheckCircle2 size={16} /> Done
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function App() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);

  const [activePage, setActivePage] = useState("overview");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [showCreate, setShowCreate] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resolvingId, setResolvingId] = useState(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [compactMode, setCompactMode] = useState(false);
  const [showDescriptions, setShowDescriptions] = useState(true);

  const loadData = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError("");

    try {
      const [ticketData, statsData] = await Promise.all([
        api.getTickets(),
        api.getStats(),
      ]);

      setTickets(Array.isArray(ticketData) ? ticketData : []);
      setStats(statsData);
    } catch (requestError) {
      console.error(requestError);
      setError(
        "Unable to load data. Check that FastAPI is running on port 8000."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchesSearch =
        !query ||
        String(ticket.id).includes(query) ||
        ticket.title?.toLowerCase().includes(query) ||
        ticket.description?.toLowerCase().includes(query) ||
        ticket.category?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" || ticket.status === statusFilter;

      const matchesPriority =
        priorityFilter === "all" || ticket.priority === priorityFilter;

      const matchesCategory =
        categoryFilter === "all" || ticket.category === categoryFilter;

      const matchesPage =
        activePage === "open"
          ? ticket.status === "open"
          : activePage === "resolved"
            ? ticket.status === "closed"
            : true;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesCategory &&
        matchesPage
      );
    });
  }, [
    tickets,
    search,
    statusFilter,
    priorityFilter,
    categoryFilter,
    activePage,
  ]);

  const openCount = tickets.filter((ticket) => ticket.status === "open").length;
  const closedCount = tickets.filter((ticket) => ticket.status === "closed").length;
  const highCount = tickets.filter(
    (ticket) => ticket.status === "open" && ticket.priority === "high"
  ).length;

  const totalCount = stats?.total_tickets ?? tickets.length;
  const categoryData = Object.entries(stats?.tickets_by_category || {}).map(
    ([name, value]) => ({ name, value })
  );

  const priorityData = ["high", "medium", "low"].map((priority) => ({
    name: priority.charAt(0).toUpperCase() + priority.slice(1),
    tickets: stats?.tickets_by_priority?.[priority] ?? 0,
    color: COLORS[priority],
  }));

  const pageInfo = {
    overview: {
      title: "Overview",
      description: "A clear view of your customer support operations.",
    },
    tickets: {
      title: "All tickets",
      description: "Search, review and manage every customer request.",
    },
    open: {
      title: "Open tickets",
      description: "Requests that still need your team's attention.",
    },
    resolved: {
      title: "Resolved tickets",
      description: "A record of customer requests that have been closed.",
    },
    analytics: {
      title: "Analytics",
      description: "Explore ticket volume, categories and priority distribution.",
    },
    settings: {
      title: "Settings",
      description: "Personalize your SupportIQ workspace.",
    },
  }[activePage];

  function navigate(page) {
    setActivePage(page);
    setMobileOpen(false);
    setSearch("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setCategoryFilter("all");
  }

  async function createTicket(ticket) {
    setSubmitting(true);
    setError("");

    try {
      await api.createTicket(ticket);
      await loadData(false);
      setNotice("Ticket created successfully.");
    } finally {
      setSubmitting(false);
    }
  }

  async function resolveTicket(id) {
    setResolvingId(id);
    setError("");

    try {
      await api.closeTicket(id);
      setSelectedTicket(null);
      await loadData(false);
      setNotice(`Ticket #${id} has been resolved.`);
    } catch (requestError) {
      setError(requestError.message || `Unable to resolve ticket #${id}.`);
    } finally {
      setResolvingId(null);
    }
  }

  function refresh() {
    setRefreshing(true);
    loadData(false);
  }

  return (
    <div className={`app-shell ${compactMode ? "app-compact" : ""}`}>
      {mobileOpen && (
        <button
          type="button"
          className="mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? "sidebar-mobile-open" : ""} `}>
        <div className="brand">
          <div className="brand-mark">
            <Headphones size={22} />
          </div>
          <div className="brand-copy">
            <strong>supportiq</strong>
            <span>SUPPORT OPERATIONS</span>
          </div>
          <button
            className="mobile-close icon-button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X size={19} />
          </button>
        </div>

        <div className="workspace-switcher">
          <div className="workspace-avatar">S</div>
          <div className="workspace-copy">
            <strong>Support workspace</strong>
            <span>Customer operations</span>
          </div>
        </div>

        <div className="sidebar-section-label">WORKSPACE</div>

        <nav className="sidebar-nav">
          {NAVIGATION.slice(0, 5).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`nav-item ${activePage === id ? "nav-item-active" : ""}`}
              onClick={() => navigate(id)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {id === "tickets" && (
                <span className="nav-count">{tickets.length}</span>
              )}
              {id === "open" && openCount > 0 && (
                <span className="nav-count">{openCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-section-label tools-label">PREFERENCES</div>

        <nav className="sidebar-nav">
          <button
            type="button"
            className={`nav-item ${activePage === "settings" ? "nav-item-active" : ""}`}
            onClick={() => navigate("settings")}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
          <button
            type="button"
            className="nav-item"
            onClick={() => window.open("http://127.0.0.1:8000/docs", "_blank")}
          >
            <ShieldCheck size={18} />
            <span>API documentation</span>
          </button>
        </nav>

        <div className="sidebar-spacer" />

        <div className="sidebar-help">
          <div className="help-icon">
            <MessageSquare size={20} />
          </div>
          <strong>Every request matters.</strong>
          <p>Keep customer issues organized and visible.</p>
          <button type="button" onClick={() => setShowCreate(true)}>
            Create a ticket <ChevronRight size={15} />
          </button>
        </div>

        <div className="sidebar-profile">
          <div className="profile-avatar">SA</div>
          <div className="profile-copy">
            <strong>Support Admin</strong>
            <span>Workspace administrator</span>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu icon-button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={21} />
            </button>
            <div className="breadcrumb">
              <span>SupportIQ</span>
              <span className="breadcrumb-separator">/</span>
              <strong>{pageInfo.title}</strong>
            </div>
          </div>

          <div className="topbar-actions">
            <div className="system-status">
              <span
                className={`system-status-dot ${error ? "system-status-error" : ""}`}
              />
              {error ? "Connection issue" : "Workspace"}
            </div>
            <div className="topbar-avatar">SA</div>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-section">
            <div>
              <div className="eyebrow welcome-eyebrow">
                <span className="live-dot" />
                CUSTOMER OPERATIONS
              </div>
              <h1>{pageInfo.title}</h1>
              <p className="welcome-subtitle">{pageInfo.description}</p>
            </div>

            <div className="welcome-actions">
              <button
                className="button button-secondary refresh-button"
                onClick={refresh}
                disabled={refreshing}
              >
                <RefreshCw size={16} className={refreshing ? "spin" : ""} />
                Refresh
              </button>
              <button
                className="button button-primary"
                onClick={() => setShowCreate(true)}
              >
                <Plus size={17} />
                New ticket
              </button>
            </div>
          </section>

          {error && (
            <div className="alert-banner alert-error">
              <AlertCircle size={18} />
              <span>{error}</span>
              <button
                className="icon-button"
                onClick={() => setError("")}
                aria-label="Dismiss error"
              >
                <X size={17} />
              </button>
            </div>
          )}

          {notice && (
            <div className="alert-banner alert-success">
              <CheckCircle2 size={18} />
              <span>{notice}</span>
              <button
                className="icon-button"
                onClick={() => setNotice("")}
                aria-label="Dismiss notification"
              >
                <X size={17} />
              </button>
            </div>
          )}

          {activePage === "overview" && (
            <>
              <section className="app-metrics-grid">
                <Metric
                  label="Total tickets"
                  value={loading ? "—" : totalCount}
                  detail="All recorded customer requests"
                  icon={MessageSquare}
                />
                <Metric
                  label="Awaiting resolution"
                  value={loading ? "—" : stats?.open_tickets ?? openCount}
                  detail="Currently open"
                  icon={Clock3}
                />
                <Metric
                  label="Resolved"
                  value={loading ? "—" : stats?.closed_tickets ?? closedCount}
                  detail="Successfully closed"
                  icon={CheckCircle2}
                />
                <Metric
                  label="High priority"
                  value={loading ? "—" : highCount}
                  detail="Open and need attention"
                  icon={AlertCircle}
                />
              </section>

              <section className="charts-grid app-charts-grid">
                <article className="panel chart-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Priority distribution</h2>
                      <p>Tickets grouped by urgency</p>
                    </div>
                    <BarChart3 size={19} />
                  </div>

                  <div className="priority-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={priorityData}>
                        <CartesianGrid
                          strokeDasharray="3 5"
                          vertical={false}
                          stroke="#e6e8e1"
                        />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#70776f", fontSize: 12 }}
                        />
                        <YAxis
                          allowDecimals={false}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#70776f", fontSize: 12 }}
                        />
                        <Tooltip />
                        <Bar
                          dataKey="tickets"
                          name="Tickets"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={48}
                        >
                          {priorityData.map((item) => (
                            <Cell key={item.name} fill={item.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </article>

                <article className="panel chart-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Ticket categories</h2>
                      <p>Distribution across support areas</p>
                    </div>
                    <Activity size={19} />
                  </div>

                  {categoryData.length > 0 ? (
                    <div className="category-chart-layout">
                      <div className="category-pie">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categoryData}
                              dataKey="value"
                              nameKey="name"
                              innerRadius="62%"
                              outerRadius="88%"
                              paddingAngle={3}
                            >
                              {categoryData.map((item, index) => (
                                <Cell
                                  key={item.name}
                                  fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="category-legend">
                        {categoryData.map((item, index) => (
                          <div key={item.name} className="category-legend-item">
                            <span
                              className="legend-dot"
                              style={{
                                backgroundColor:
                                  CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                              }}
                            />
                            <span className="category-name">{item.name}</span>
                            <strong>{item.value}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="empty-chart">
                      <BarChart3 size={25} />
                      <strong>No category data yet</strong>
                      <p>Create tickets to populate this chart.</p>
                    </div>
                  )}
                </article>
              </section>

              <section className="panel tickets-panel">
                <div className="tickets-heading">
                  <div>
                    <h2>Recent tickets</h2>
                    <p>The latest customer requests in your workspace.</p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => navigate("tickets")}
                  >
                    View all <ChevronRight size={15} />
                  </button>
                </div>

                <TicketTable
                  tickets={filteredTickets.slice(0, 5)}
                  loading={loading}
                  search={search}
                  setSearch={setSearch}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  priorityFilter={priorityFilter}
                  setPriorityFilter={setPriorityFilter}
                  categoryFilter={categoryFilter}
                  setCategoryFilter={setCategoryFilter}
                  onSelect={setSelectedTicket}
                  onResolve={resolveTicket}
                  resolvingId={resolvingId}
                  onCreate={() => setShowCreate(true)}
                  showFilters={false}
                />
              </section>
            </>
          )}

          {(activePage === "tickets" ||
            activePage === "open" ||
            activePage === "resolved") && (
              <section className="panel tickets-panel app-full-ticket-panel">
                <div className="tickets-heading">
                  <div>
                    <h2>{pageInfo.title}</h2>
                    <p>
                      {filteredTickets.length} matching ticket
                      {filteredTickets.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <button
                    className="button button-secondary"
                    onClick={refresh}
                    disabled={refreshing}
                  >
                    <RefreshCw
                      size={15}
                      className={refreshing ? "spin" : ""}
                    />
                    Refresh
                  </button>
                </div>

                <TicketTable
                  tickets={filteredTickets}
                  loading={loading}
                  search={search}
                  setSearch={setSearch}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  priorityFilter={priorityFilter}
                  setPriorityFilter={setPriorityFilter}
                  categoryFilter={categoryFilter}
                  setCategoryFilter={setCategoryFilter}
                  onSelect={setSelectedTicket}
                  onResolve={resolveTicket}
                  resolvingId={resolvingId}
                  onCreate={() => setShowCreate(true)}
                />

                <div className="table-footer">
                  <span>
                    Showing <strong>{filteredTickets.length}</strong> of{" "}
                    <strong>{tickets.length}</strong> tickets
                  </span>
                </div>
              </section>
            )}

          {activePage === "analytics" && (
            <>
              <section className="app-metrics-grid">
                <Metric
                  label="Total volume"
                  value={loading ? "—" : totalCount}
                  detail="All tickets in the database"
                  icon={Ticket}
                />
                <Metric
                  label="Open workload"
                  value={loading ? "—" : openCount}
                  detail="Tickets still being handled"
                  icon={Clock3}
                />
                <Metric
                  label="Resolved"
                  value={loading ? "—" : closedCount}
                  detail="Tickets marked as closed"
                  icon={CheckCircle2}
                />
                <Metric
                  label="Resolution share"
                  value={totalCount ? `${Math.round((closedCount / totalCount) * 100)}% ` : "—"}
                  detail="Resolved tickets / total tickets"
                  icon={Activity}
                />
              </section>

              <section className="charts-grid app-charts-grid">
                <article className="panel chart-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Priority analysis</h2>
                      <p>Number of tickets by assigned priority</p>
                    </div>
                  </div>
                  <div className="priority-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={priorityData}>
                        <CartesianGrid
                          strokeDasharray="3 5"
                          vertical={false}
                          stroke="#e6e8e1"
                        />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Bar dataKey="tickets" name="Tickets" radius={[4, 4, 0, 0]}>
                          {priorityData.map((item) => (
                            <Cell key={item.name} fill={item.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </article>

                <article className="panel chart-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Category analysis</h2>
                      <p>Recorded tickets by category</p>
                    </div>
                  </div>
                  {categoryData.length ? (
                    <div className="category-chart-layout">
                      <div className="category-pie">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categoryData}
                              dataKey="value"
                              nameKey="name"
                              innerRadius="60%"
                              outerRadius="86%"
                              paddingAngle={3}
                            >
                              {categoryData.map((item, index) => (
                                <Cell
                                  key={item.name}
                                  fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="category-legend">
                        {categoryData.map((item, index) => (
                          <div key={item.name} className="category-legend-item">
                            <span
                              className="legend-dot"
                              style={{
                                backgroundColor:
                                  CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                              }}
                            />
                            <span className="category-name">{item.name}</span>
                            <strong>{item.value}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="empty-chart">
                      <strong>No category data available</strong>
                      <p>Category data will appear when tickets exist.</p>
                    </div>
                  )}
                </article>
              </section>

              <section className="panel tickets-panel">
                <div className="tickets-heading">
                  <div>
                    <h2>Workload by category</h2>
                    <p>Counts returned by the dashboard statistics endpoint.</p>
                  </div>
                </div>
                {categoryData.length ? (
                  <div className="app-category-list">
                    {categoryData.map((item, index) => (
                      <div className="app-category-row" key={item.name}>
                        <span
                          className="legend-dot"
                          style={{
                            backgroundColor:
                              CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                          }}
                        />
                        <span>{item.name}</span>
                        <div className="app-category-track">
                          <span
                            style={{
                              width: `${totalCount ? (item.value / totalCount) * 100 : 0}% `,
                              backgroundColor:
                                CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                            }}
                          />
                        </div>
                        <strong>{item.value}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-chart">
                    <p>No category statistics have been returned by the backend.</p>
                  </div>
                )}
              </section>
            </>
          )}

          {activePage === "settings" && (
            <section className="panel app-settings-panel">
              <div className="tickets-heading">
                <div>
                  <h2>Workspace preferences</h2>
                  <p>Manage how the SupportIQ interface appears on this device.</p>
                </div>
                <Settings size={21} />
              </div>

              <div className="app-setting-row">
                <div>
                  <strong>Compact interface</strong>
                  <p>Reduce spacing to display more information on screen.</p>
                </div>
                <button
                  type="button"
                  className={`app-toggle ${compactMode ? "app-toggle-on" : ""}`}
                  aria-pressed={compactMode}
                  onClick={() => setCompactMode((value) => !value)}
                >
                  <span />
                </button>
              </div>

              <div className="app-setting-row">
                <div>
                  <strong>Ticket descriptions</strong>
                  <p>Show or hide description previews in the ticket list.</p>
                </div>
                <button
                  type="button"
                  className={`app-toggle ${showDescriptions ? "app-toggle-on" : ""}`}
                  aria-pressed={showDescriptions}
                  onClick={() => {
                    setShowDescriptions((value) => !value);
                    document.body.classList.toggle(
                      "hide-ticket-descriptions",
                      showDescriptions
                    );
                  }}
                >
                  <span />
                </button>
              </div>

              <div className="app-setting-row">
                <div>
                  <strong>Backend connection</strong>
                  <p>API endpoint: http://127.0.0.1:8000</p>
                </div>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={async () => {
                    try {
                      await api.health();
                      setNotice("Backend health check succeeded.");
                    } catch {
                      setError("The backend health check failed.");
                    }
                  }}
                >
                  <Activity size={15} />
                  Test connection
                </button>
              </div>

              <div className="app-settings-note">
                <ShieldCheck size={19} />
                <div>
                  <strong>Local workspace</strong>
                  <p>
                    These interface preferences are temporary and will reset
                    when the page is reloaded. Persistent user accounts and
                    server-side settings have not been configured.
                  </p>
                </div>
              </div>
            </section>
          )}

          <footer className="page-footer">
            <span>
              <span className="footer-status-dot" />
              {error ? "Backend connection needs attention" : "SupportIQ workspace"}
            </span>
            <span>Customer Support Operations</span>
            <span>v1.1.0</span>
          </footer>
        </div>
      </main>

      {showCreate && (
        <TicketForm
          onClose={() => setShowCreate(false)}
          onCreate={createTicket}
          submitting={submitting}
        />
      )}

      {selectedTicket && (
        <TicketDetails
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onResolve={resolveTicket}
          resolving={resolvingId === selectedTicket.id}
        />
      )}
    </div>
  );
}