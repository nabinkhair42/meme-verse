import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Protected routes that require authentication
const protectedRoutes = [
  '/profile',
  '/generate',
  '/upload',
]

// Login page path
const loginPath = '/login'

export function middleware(request: NextRequest) {
  // Get token from cookie
  const token = request.cookies.get('auth-token')?.value
  
  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  
  // If the route is protected and no token exists, redirect to login
  if (isProtectedRoute && !token) {
    const url = new URL(loginPath, request.url)
    url.searchParams.set('callbackUrl', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }
  
  // For API routes, ensure proper authentication headers
  if (request.nextUrl.pathname.startsWith('/api/') && 
      !request.nextUrl.pathname.startsWith('/api/auth/login') && 
      !request.nextUrl.pathname.startsWith('/api/auth/register')) {
    
    // If there's a token in the cookie but no Authorization header,
    // add the token to the Authorization header
    if (token && !request.headers.get('authorization')) {
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('Authorization', `Bearer ${token}`)
      
      // Create a new request with the updated headers
      const response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
      
      return response
    }
  }
  
  // Log auth headers for debugging
  if (request.nextUrl.pathname.startsWith('/api/auth')) {
    console.log('Auth API Request:', {
      path: request.nextUrl.pathname,
      headers: {
        authorization: request.headers.get('authorization'),
      },
    });
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
    // Match protected client routes
    '/profile/:path*',
    '/generate/:path*',
    '/upload/:path*',
  ],
}; 