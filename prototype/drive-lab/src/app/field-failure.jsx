import { Component } from "react";

export function FieldFailure({ label, recovery }) {
  return (
    <div className="field-failure" role="status">
      <strong>{label}</strong>
      <span>{recovery === "waiting" ? "Waiting for connection · retrying automatically"
        : recovery === "retrying" || recovery === "loading" ? "Retrying visual · controls remain active"
          : recovery === "exhausted" ? "Retry paused · switch away and back to retry"
            : "Visual unavailable · controls remain active"}</span>
    </div>
  );
}

export class EnvironmentErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    this.props.onError?.(error);
  }

  render() {
    if (this.state.failed) {
      return <FieldFailure label={this.props.label} recovery={this.props.recovery} />;
    }
    return this.props.children;
  }
}
