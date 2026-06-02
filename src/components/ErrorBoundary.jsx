import React, { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-[50vh] w-full items-center justify-center p-6">
                    <Card className="w-full max-w-md border-red-100 bg-red-50/50">
                        <CardContent className="flex flex-col items-center p-8 text-center">
                            <div className="mb-4 rounded-full bg-red-100 p-3 text-red-600">
                                <AlertTriangle size={32} />
                            </div>
                            <h2 className="mb-2 text-xl font-bold text-slate-900">Something went wrong</h2>
                            <p className="mb-6 text-sm text-slate-500">
                                We encountered an unexpected error. Please try refreshing the page.
                            </p>
                            <Button 
                                onClick={() => window.location.reload()} 
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                <RefreshCw size={16} className="mr-2" />
                                Refresh Page
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}
