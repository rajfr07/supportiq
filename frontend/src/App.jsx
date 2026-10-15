import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  Headphones,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Ticket,
  TrendingUp,
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

const CATEGORY_OPTIONS = [
  "Billing",
  "Technical Support",
  "Account Access",
  "Product",
  "Shipping",
  "Other",
];

const PRIORITY_COLORS = {
  high: "#e05b63",
  medium: "#e5a443",
  low: "#39a98b",
};

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

function getInitials(value = "Support User") {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function StatusBadge({ status }) {
  const closed = status === "closed";

  return (
    <span className={`status-badge ${closed ? "status-closed" : "status-open"}`}>
      <span className="status-dot" />
      {closed ? "Closed" : "Open"}
    </span>
  );
}

function PriorityBadge({ priority }) {
  return (
    <span className={`priority-badge priority-${priority || "medium"}`}>
      <span className="priority-dot" />
      {(priority || "medium").charAt(0).toUpperCase() +
        (priority || "medium").slice(1)}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  description,
  trendIcon: TrendIcon,
}) {
  return (
    <article className="stat-card">
      <div className="stat-card-top">
        <span className="stat-label">{label}</span>
        <span className={`stat-icon ${color}`}>
          <Icon size={19} />
        </span>
      </div>

      <div className="stat-value">{value}</div>

      <div className="stat-description">
        {TrendIcon && <TrendIcon size={14} />}
        <span>{description}</span>
      </div>
    </article>
  );
}

function TicketModal({ onClose, onCreate, submitting }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    category: "Technical Support",
  });

  const [formError, setFormError] = useState("");

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
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
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        category: form.category,
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
    >
      <section
        className="ticket-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-heading">
          <div>
            <span className="eyebrow">CUSTOMER SUPPORT</span>
            <h2 id="modal-title">Create new ticket</h2>
            <p>Add a customer issue to your support queue.</p>
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        <form className="ticket-form" onSubmit={handleSubmit}>
          <label>
            Ticket title
            <input
              name="title"
              value={form.title}
              onChange={updateField}
              placeholder="e.g. Unable to complete payment"
              maxLength={200}
              required
            />
          </label>

          <label>
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={updateField}
              placeholder="Describe the issue and any relevant details..."
              rows={4}
              required
            />
          </label>

          <div className="form-row">
            <label>
              Priority
              <select
                name="priority"
                value={form.priority}
                onChange={updateField}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>

            <label>
              Category
              <select
                name="category"
                value={form.category}
                onChange={updateField}
              >
                {CATEGORY_OPTIONS.map((category) => (
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
              <span>{formError}</span>
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
                <LoaderCircle className="spin" size={17} />
              ) : (
                <Plus size={17} />
              )}
              Create ticket
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function App() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [activePage, setActivePage] = useState("overview");
  const [showModal, setShowModal] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [closingId, setClosingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);

    setError("");

    try {
      const [ticketData, statsData] = await Promise.all([
        api.getTickets(),
        api.getStats(),
      ]);

      setTickets(ticketData);
      setStats(statsData);
    } catch (requestError) {
      setError(
        "Unable to connect to the backend. Check that FastAPI is running on port 8000."
      );
      console.error(requestError);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!success) return undefined;

    const timer = setTimeout(() => setSuccess(""), 3500);

    return () => clearTimeout(timer);
  }, [success]);

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

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesCategory
      );
    });
  }, [tickets, search, statusFilter, priorityFilter, categoryFilter]);

  const openTickets = tickets.filter(
    (ticket) => ticket.status === "open"
  ).length;

  const closedTickets = tickets.filter(
    (ticket) => ticket.status === "closed"
  ).length;

  const highPriorityTickets = tickets.filter(
    (ticket) => ticket.priority === "high" && ticket.status === "open"
  ).length;

  const categoryData = Object.entries(stats?.tickets_by_category || {}).map(
    ([name, value]) => ({ name, value })
  );

  const priorityData = ["high", "medium", "low"].map((priority) => ({
    name: priority.charAt(0).toUpperCase() + priority.slice(1),
    tickets: stats?.tickets_by_priority?.[priority] || 0,
    color: PRIORITY_COLORS[priority],
  }));

  async function handleCreateTicket(ticket) {
    setSubmitting(true);

    try {
      await api.createTicket(ticket);
      setSuccess("Ticket created successfully.");
      await loadData(false);
    } catch (requestError) {
      throw requestError;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCloseTicket(ticketId) {
    setClosingId(ticketId);
    setError("");

    try {
      await api.closeTicket(ticketId);
      setSuccess(`Ticket #${ticketId} closed successfully.`);
      await loadData(false);
    } catch (requestError) {
      setError(
        requestError.message || `Unable to close ticket #${ticketId}.`
      );
    } finally {
      setClosingId(null);
    }
  }

  function navigate(page) {
    setActivePage(page);
    setMobileSidebarOpen(false);

    if (page === "overview") {
      setStatusFilter("all");
    }

    if (page === "tickets") {
      setStatusFilter("all");
    }

    if (page === "open") {
      setStatusFilter("open");
    }

    if (page === "resolved") {
      setStatusFilter("closed");
    }
  }

  const pageTitle =
    activePage === "overview"
      ? "Dashboard overview"
      : activePage === "open"
        ? "Open tickets"
        : activePage === "resolved"
          ? "Resolved tickets"
          : activePage === "tickets"
            ? "All tickets"
            : activePage === "analytics"
              ? "Analytics"
              : "Settings";

  return (
    <div className="app-shell">
      {mobileSidebarOpen && (
        <button
          type="button"
          className="mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileSidebarOpen ? "sidebar-mobile-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <Headphones size={23} strokeWidth={2.4} />
          </div>

          <div className="brand-copy">
            <strong>supportiq</strong>
            <span>SUPPORT INTELLIGENCE</span>
          </div>

          <button
            type="button"
            className="mobile-close icon-button"
            onClick={() => setMobileSidebarOpen(false)}
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

          <ChevronDown size={16} className="muted-icon" />
        </div>

        <div className="sidebar-section-label">WORKSPACE</div>

        <nav className="sidebar-nav">
          <button
            type="button"
            className={`nav-item ${activePage === "overview" ? "nav-item-active" : ""}`}
            onClick={() => navigate("overview")}
          >
            <LayoutDashboard size={18} />
            <span>Overview</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activePage === "tickets" ? "nav-item-active" : ""}`}
            onClick={() => navigate("tickets")}
          >
            <Ticket size={18} />
            <span>All tickets</span>
            <span className="nav-count">{tickets.length}</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activePage === "open" ? "nav-item-active" : ""}`}
            onClick={() => navigate("open")}
          >
            <Clock3 size={18} />
            <span>Open tickets</span>
            {openTickets > 0 && <span className="nav-count">{openTickets}</span>}
          </button>

          <button
            type="button"
            className={`nav-item ${activePage === "resolved" ? "nav-item-active" : ""}`}
            onClick={() => navigate("resolved")}
          >
            <CheckCircle2 size={18} />
            <span>Resolved</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activePage === "analytics" ? "nav-item-active" : ""}`}
            onClick={() => navigate("analytics")}
          >
            <BarChart3 size={18} />
            <span>Analytics</span>
          </button>
        </nav>

        <div className="sidebar-section-label tools-label">TOOLS</div>

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
            <CircleHelp size={18} />
            <span>API documentation</span>
          </button>
        </nav>

        <div className="sidebar-spacer" />

        <div className="sidebar-help">
          <div className="help-icon">
            <ShieldCheck size={21} />
          </div>

          <strong>Your support, simplified.</strong>

          <p>Keep customer conversations organized and your team in control.</p>

          <button type="button" onClick={() => setShowModal(true)}>
            Create a ticket <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="sidebar-profile">
          <div className="profile-avatar">RA</div>

          <div className="profile-copy">
            <strong>Support Admin</strong>
            <span>Administrator</span>
          </div>

          <button
            type="button"
            className="icon-button logout-button"
            aria-label="Account menu"
            onClick={() => setSuccess("You are signed in as Support Admin.")}
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-menu icon-button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={21} />
            </button>

            <div className="breadcrumb">
              <span>Workspace</span>
              <span className="breadcrumb-separator">/</span>
              <strong>{pageTitle}</strong>
            </div>
          </div>

          <div className="topbar-actions">
            <div className="system-status">
              <span className={`system-status-dot ${error ? "system-status-error" : ""}`} />
              {error ? "Connection issue" : "System operational"}
            </div>

            <button
              type="button"
              className="icon-button notification-button"
              aria-label="Notifications"
              onClick={() => setSuccess("You're all caught up on notifications.")}
            >
              <Bell size={19} />
              <span className="notification-dot" />
            </button>

            <div className="topbar-avatar">RA</div>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-section">
            <div>
              <div className="eyebrow welcome-eyebrow">
                <span className="live-dot" />
                CUSTOMER OPERATIONS
              </div>

              <h1>{pageTitle}</h1>

              <p className="welcome-subtitle">
                Here's what's happening with your customer support today.
              </p>
            </div>

            <div className="welcome-actions">
              <button
                type="button"
                className="button button-secondary refresh-button"
                onClick={() => {
                  setRefreshing(true);
                  loadData(false);
                }}
                disabled={refreshing}
              >
                <RefreshCw size={16} className={refreshing ? "spin" : ""} />
                Refresh
              </button>

              <button
                type="button"
                className="button button-primary"
                onClick={() => setShowModal(true)}
              >
                <Plus size={17} />
                New ticket
              </button>
            </div>
          </section>

          {error && (
            <div className="alert-banner alert-error">
              <AlertCircle size={19} />
              <div>
                <strong>Backend connection problem</strong>
                <p>{error}</p>
              </div>

              <button
                type="button"
                className="icon-button"
                aria-label="Dismiss error"
                onClick={() => setError("")}
              >
                <X size={18} />
              </button>
            </div>
          )}

          {success && (
            <div className="alert-banner alert-success">
              <CheckCircle2 size={18} />
              <span>{success}</span>
              <button
                type="button"
                className="icon-button"
                aria-label="Dismiss message"
                onClick={() => setSuccess("")}
              >
                <X size={18} />
              </button>
            </div>
          )}

          <section className="stats-grid">
            <StatCard
              label="Total tickets"
              value={loading ? "—" : stats?.total_tickets ?? tickets.length}
              icon={MessageSquare}
              color="icon-purple"
              description="All recorded tickets"
              trendIcon={TrendingUp}
            />

            <StatCard
              label="Open tickets"
              value={loading ? "—" : stats?.open_tickets ?? openTickets}
              icon={Clock3}
              color="icon-blue"
              description="Awaiting resolution"
              trendIcon={ArrowUpRight}
            />

            <StatCard
              label="Resolved tickets"
              value={loading ? "—" : stats?.closed_tickets ?? closedTickets}
              icon={CheckCircle2}
              color="icon-green"
              description="Successfully closed"
              trendIcon={ArrowDownRight}
            />

            <StatCard
              label="High priority"
              value={loading ? "—" : highPriorityTickets}
              icon={AlertCircle}
              color="icon-orange"
              description="Open and need attention"
              trendIcon={ArrowUpRight}
            />
          </section>

          <section className="charts-grid">
            <article className="panel chart-panel">
              <div className="panel-heading">
                <div>
                  <h2>Ticket priorities</h2>
                  <p>Distribution across priority levels</p>
                </div>

                <span className="panel-icon">
                  <BarChart3 size={18} />
                </span>
              </div>

              <div className="priority-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={priorityData}
                    margin={{ top: 12, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 5"
                      vertical={false}
                      stroke="#edf0f5"
                    />

                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#7d8798", fontSize: 12 }}
                      dy={8}
                    />

                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#7d8798", fontSize: 12 }}
                    />

                    <Tooltip
                      cursor={{ fill: "#f7f8fc" }}
                      contentStyle={{
                        border: "1px solid #e9edf4",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                    />

                    <Bar dataKey="tickets" radius={[6, 6, 0, 0]} maxBarSize={52}>
                      {priorityData.map((item) => (
                        <Cell key={item.name} fill={item.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-legend">
                {priorityData.map((item) => (
                  <div key={item.name} className="legend-item">
                    <span
                      className="legend-dot"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.name}</span>
                    <strong>{item.tickets}</strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel chart-panel">
              <div className="panel-heading">
                <div>
                  <h2>Tickets by category</h2>
                  <p>Understand your support workload</p>
                </div>

                <span className="panel-icon">
                  <Activity size={18} />
                </span>
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
                          stroke="none"
                        >
                          {categoryData.map((item, index) => (
                            <Cell
                              key={item.name}
                              fill={[
                                "#7566df",
                                "#48a5e7",
                                "#43b99b",
                                "#efb253",
                                "#ec7d8b",
                                "#9ba8bc",
                              ][index % 6]}
                            />
                          ))}
                        </Pie>

                        <Tooltip
                          contentStyle={{
                            border: "1px solid #e9edf4",
                            borderRadius: 12,
                            fontSize: 12,
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="category-legend">
                    {categoryData.slice(0, 6).map((item, index) => (
                      <div key={item.name} className="category-legend-item">
                        <span
                          className="legend-dot"
                          style={{
                            backgroundColor: [
                              "#7566df",
                              "#48a5e7",
                              "#43b99b",
                              "#efb253",
                              "#ec7d8b",
                              "#9ba8bc",
                            ][index % 6],
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
                  <div className="empty-chart-icon">
                    <BarChart3 size={25} />
                  </div>
                  <strong>No category data yet</strong>
                  <p>Create tickets to see the category breakdown.</p>
                </div>
              )}
            </article>
          </section>

          <section className="panel tickets-panel">
            <div className="tickets-heading">
              <div>
                <div className="tickets-title-line">
                  <h2>
                    {activePage === "open"
                      ? "Open tickets"
                      : activePage === "resolved"
                        ? "Resolved tickets"
                        : "Recent tickets"}
                  </h2>

                  <span className="ticket-total">{filteredTickets.length}</span>
                </div>

                <p>Manage customer requests and track their progress.</p>
              </div>

              <button
                type="button"
                className="text-button"
                onClick={() => navigate("tickets")}
              >
                View all tickets <ArrowUpRight size={15} />
              </button>
            </div>

            <div className="ticket-toolbar">
              <div className="search-box">
                <Search size={17} />

                <input
                  type="search"
                  placeholder="Search tickets, IDs or descriptions..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />

                {search && (
                  <button
                    type="button"
                    className="search-clear"
                    aria-label="Clear search"
                    onClick={() => setSearch("")}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <div className="filter-group">
                <SlidersHorizontal size={16} className="filter-icon" />

                <select
                  aria-label="Filter by status"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="all">All statuses</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
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
                  {CATEGORY_OPTIONS.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="table-wrapper">
              <table className="tickets-table">
                <thead>
                  <tr>
                    <th>TICKET</th>
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
                        <span>Loading tickets...</span>
                      </td>
                    </tr>
                  ) : filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="table-message">
                        <div className="empty-table-icon">
                          <Search size={22} />
                        </div>

                        <strong>No tickets found</strong>

                        <span>
                          Try another filter or create a new customer ticket.
                        </span>

                        <button
                          type="button"
                          className="button button-primary empty-create-button"
                          onClick={() => setShowModal(true)}
                        >
                          <Plus size={16} /> Create ticket
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredTickets.map((ticket) => (
                      <tr key={ticket.id}>
                        <td>
                          <div className="ticket-cell">
                            <div className="ticket-cell-icon">
                              <MessageSquare size={17} />
                            </div>

                            <div className="ticket-cell-copy">
                              <strong>{ticket.title}</strong>
                              <span>
                                #{ticket.id} ·{" "}
                                {(ticket.description || "").length > 55
                                  ? `${ticket.description.slice(0, 55)}…`
                                  : ticket.description}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="category-tag">
                            {ticket.category || "Uncategorized"}
                          </span>
                        </td>

                        <td>
                          <PriorityBadge priority={ticket.priority} />
                        </td>

                        <td>
                          <StatusBadge status={ticket.status} />
                        </td>

                        <td className="date-cell">
                          {formatDate(ticket.created_at)}
                        </td>

                        <td>
                          {ticket.status === "open" ? (
                            <button
                              type="button"
                              className="close-ticket-button"
                              disabled={closingId === ticket.id}
                              onClick={() => handleCloseTicket(ticket.id)}
                            >
                              {closingId === ticket.id ? (
                                <LoaderCircle size={15} className="spin" />
                              ) : (
                                <CheckCircle2 size={15} />
                              )}
                              Close
                            </button>
                          ) : (
                            <span className="completed-action">
                              <CheckCircle2 size={16} />
                              Done
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <span>
                Showing <strong>{filteredTickets.length}</strong> of{" "}
                <strong>{tickets.length}</strong> tickets
              </span>

              <button
                type="button"
                className="button button-secondary small-refresh"
                onClick={() => {
                  setRefreshing(true);
                  loadData(false);
                }}
                disabled={refreshing}
              >
                <RefreshCw
                  size={14}
                  className={refreshing ? "spin" : ""}
                />
                Refresh data
              </button>
            </div>
          </section>

          <footer className="page-footer">
            <span>
              <span className="footer-status-dot" />
              SupportIQ is running
            </span>

            <span>Customer Support Intelligence Platform</span>

            <span>v1.0.0</span>
          </footer>
        </div>
      </main>

      {showModal && (
        <TicketModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreateTicket}
          submitting={submitting}
        />
      )}
    </div>
  );
}