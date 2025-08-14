import React from 'react';
import { Link, useLocation } from 'react-router';
import { Button } from '~/components/ui/button';
import { Container } from '~/components/ui/container';
import { BookOpen, Search, Home, ChevronDown, MessageCircle, Users, GraduationCap } from 'lucide-react';
import { GitHubIcon } from './icons/GitHubIcon';
import { Logo } from './Logo';
import { cn } from '~/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

export function Navigation() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const navItems = [
    {
      href: '/',
      label: 'Home',
      icon: Home
    },
    {
      href: '/search',
      label: 'Search',
      icon: Search
    },
    {
      href: '/docs',
      label: 'Docs',
      icon: BookOpen
    }
  ];

  return (
    <nav className={cn(
      "sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      !isHomePage && "border-b"
    )}>
      <Container>
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-3 font-bold">
              <Logo size="md" />
              <span className="hidden sm:block">Unofficial WGU Extension</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href || 
                  (item.href !== '/' && location.pathname.startsWith(item.href));
                
                return (
                  <Button
                    key={item.href}
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    asChild
                  >
                    <Link to={item.href} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </Button>
                );
              })}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    Browse
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuLabel>Resources</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/courses" className="flex items-center gap-2 cursor-pointer">
                      <BookOpen className="h-4 w-4" />
                      Courses
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/degree-plans" className="flex items-center gap-2 cursor-pointer">
                      <GraduationCap className="h-4 w-4" />
                      Degree Plans
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Communities</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/discord" className="flex items-center gap-2 cursor-pointer">
                      <MessageCircle className="h-4 w-4" />
                      Discord Servers
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/reddit" className="flex items-center gap-2 cursor-pointer">
                      <Users className="h-4 w-4" />
                      Reddit Communities
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/wgu-connect" className="flex items-center gap-2 cursor-pointer">
                      <BookOpen className="h-4 w-4" />
                      WGU Connect
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/student-groups" className="flex items-center gap-2 cursor-pointer">
                      <Users className="h-4 w-4" />
                      Student Groups
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a 
                href="https://github.com/jonshaffer/wgu-extension" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <GitHubIcon size="sm" />
                GitHub
              </a>
            </Button>
          </div>
        </div>
      </Container>
    </nav>
  );
}