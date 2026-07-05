import { Component, type ErrorInfo, type ReactNode } from "react";
import { logger } from "./logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error("ErrorBoundary caught", { error, componentStack: info.componentStack });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex h-full items-center justify-center p-8 text-center">
            <div>
              <p className="text-lg font-semibold text-red-600">حدث خطأ غير متوقع</p>
              <p className="mt-1 text-sm text-slate-500">يرجى تحديث الصفحة والمحاولة مرة أخرى</p>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
