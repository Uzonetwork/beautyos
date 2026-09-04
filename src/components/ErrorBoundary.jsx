import { Component } from 'react';

/**
 * Catches any uncaught render-time error below it and shows a plain
 * fallback instead of leaving a blank page — the worst possible failure on
 * a bad connection, since a customer can't tell it apart from the site
 * being dead. Without this, React's default behaviour on an uncaught
 * render error is to unmount the entire tree.
 *
 * This is a backstop, not a fix — a null-data render crash should be
 * guarded at its source (see the price fields on PublicView/ServiceCard/
 * OwnerDashboard fixed alongside this). It only catches errors thrown
 * during render, lifecycle methods, and effect bodies; it does not catch
 * errors from event handlers or from inside promise .then() callbacks —
 * class components are the only way to implement this, there's no hook
 * equivalent.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-sabi-dark flex flex-col items-center justify-center px-6 py-10 text-center font-sans">
          <h1 className="font-serif text-3xl font-medium text-white mb-3">Something went wrong</h1>
          <p className="text-sabi-muted text-sm mb-8 max-w-xs leading-relaxed">
            Check your connection and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-sabi-green text-sm font-semibold bg-transparent border-0 cursor-pointer underline underline-offset-4"
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
