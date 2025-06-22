
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import BookDetails from "./pages/BookDetails";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";
import PlanPage from "./pages/PlanPage";
import { BookProvider } from '@/lib/BookContextProvider';
import { UserContextProvider } from '@/lib/UserContextProvider';
import EditPage from "./pages/EditPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/*"
            element={
              <UserContextProvider>
                <Routes>
                  <Route path="/write" element={
                    <BookProvider>
                      <Index />
                    </BookProvider>
                  } />
                  <Route path="/write/book/:bookId/version/:versionId" element={
                    <BookProvider>
                      <Index />
                    </BookProvider>
                  } />
                  <Route path="/edit" element={
                    <BookProvider>
                      <EditPage />
                    </BookProvider>
                  } />
                  <Route path="/edit/book/:bookId/version/:versionId" element={
                    <BookProvider>
                      <EditPage />
                    </BookProvider>
                  } />
                  <Route path="/plan/book/:bookId/version/:versionId" element={
                    <BookProvider>
                      <PlanPage />
                    </BookProvider>
                  } />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/book/:bookId" element={<BookDetails />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </UserContextProvider>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
