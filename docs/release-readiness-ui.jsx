// release-readiness-ui.jsx
//
// This React component renders a release readiness report
// as a set of cards, one per check, along with a summary
// header showing the overall status. It expects to receive
// a `report` prop shaped like the JSON output produced by
// the readiness validation framework. Each check object
// should include an `id`, `name`, `status`, `summary`,
// `reasons`, and `evidence` array. The `release` object
// should contain `service`, `version`, and `generated_at`.

import React from 'react';

/**
 * Mapping from readiness status to CSS classes.  Feel free to
 * adjust the colours here to match your preferred design system.
 */
const statusClasses = {
  GREEN: 'bg-green-500 text-white',
  YELLOW: 'bg-yellow-500 text-black',
  RED: 'bg-red-500 text-white'
};

/**
 * A card component for rendering an individual readiness check.
 * It displays the check name, status badge, summary, failure
 * reasons (if any) and evidence links (if provided).
 */
function CheckCard({ check }) {
  const { name, status, summary, reasons = [], evidence = [] } = check;
  const statusClass = statusClasses[status] || 'bg-gray-300 text-black';

  return (
    <div className="rounded-xl shadow-sm border border-gray-200 p-4 bg-white flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold text-gray-800 mr-2 flex-1">
          {name}
        </h3>
        <span className={`px-2 py-1 rounded-md text-xs font-semibold ${statusClass}`}>
          {status}
        </span>
      </div>
      {summary && (
        <p className="text-sm text-gray-600">
          {summary}
        </p>
      )}
      {reasons.length > 0 && (
        <div className="text-sm text-gray-700">
          <div className="font-semibold text-xs text-gray-500 mb-1">Reasons</div>
          <ul className="list-disc list-inside space-y-1 pl-2">
            {reasons.map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
        </div>
      )}
      {evidence.length > 0 && (
        <div className="text-sm text-gray-700">
          <div className="font-semibold text-xs text-gray-500 mb-1">Evidence</div>
          <ul className="list-disc list-inside space-y-1 pl-2">
            {evidence.map((ev, idx) => (
              <li key={idx}>
                <a
                  href={ev.url}
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {ev.type} – {ev.identifier}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Main component for rendering the release readiness report.
 * Pass a `report` prop with `release`, `overall_status` and
 * `checks` fields. You can embed this component inside a
 * larger application or standalone page. If no report is
 * provided it will display a placeholder message.
 */
export default function ReleaseReadinessUI({ report }) {
  if (!report) {
    return (
      <div className="p-6 text-gray-600">No report data available.</div>
    );
  }

  const {
    release = {},
    overall_status: overallStatus = 'UNKNOWN',
    checks = []
  } = report;

  const overallStatusClass = statusClasses[overallStatus] || 'bg-gray-300 text-black';

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white border border-gray-200 rounded-xl shadow-sm p-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Release Readiness Report
          </h1>
          {release.service && release.version && (
            <p className="text-sm text-gray-600 mt-1">
              Service: <span className="font-medium">{release.service}</span>
              {' • '}Release: <span className="font-medium">{release.version}</span>
            </p>
          )}
          {release.generated_at && (
            <p className="text-xs text-gray-500 mt-1">
              Generated {new Date(release.generated_at).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-4 py-2 rounded-md text-sm font-semibold ${overallStatusClass}`}> 
            {overallStatus}
          </span>
        </div>
      </div>

      {/* Checks grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {checks.map((check) => (
          <CheckCard key={check.id} check={check} />
        ))}
      </div>
    </div>
  );
}