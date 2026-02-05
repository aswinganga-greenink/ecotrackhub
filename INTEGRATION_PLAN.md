# Backend-Frontend Integration Plan

## Current Analysis

### Backend Status ✅
- FastAPI REST API is properly structured
- All necessary endpoints are implemented:
  - Authentication: `/auth/login`, `/auth/register`, `/auth/me`
  - Data: `/data/`, `/analytics/metrics`, `/analytics/sectors`, `/analytics/trends`
  - Users: `/users/`
  - Panchayats: `/panchayats/`
- CORS configured for frontend URLs
- JWT authentication implemented
- Database models and schemas ready

### Frontend Static Data Usage
- `mockUsers` in AuthContext
- `mockMonthlyData` in Dashboard and Analytics
- Static calculations in carbonCalculations.ts
- Mock authentication system

## Integration Steps

### Step 1: Create API Service Layer
Create `/src/lib/api.ts` with:
- HTTP client configuration
- API endpoints mapping
- Authentication token management
- Error handling

### Step 2: Update Authentication Context
Replace mock authentication in `/src/contexts/AuthContext.tsx`:
- Connect to real backend `/auth/login`
- Store JWT tokens
- Handle logout and token refresh
- Update user state management

### Step 3: Replace Static Data in Dashboard
Update `/src/pages/Dashboard.tsx`:
- Replace `mockMonthlyData` with API calls
- Fetch analytics data from `/analytics/*` endpoints
- Implement loading states and error handling

### Step 4: Replace Static Data in Analytics
Update `/src/pages/Analytics.tsx`:
- Replace `mockMonthlyData` with API calls
- Fetch sector emissions and trends from backend
- Maintain existing UI/UX

### Step 5: Update Components
Update chart components to handle dynamic data:
- `EmissionChart.tsx`
- `SectorPieChart.tsx`
- `MetricCard.tsx`

### Step 6: Add Data Entry Integration
Create dynamic data entry forms that connect to `/data/` endpoints

### Step 7: Testing and Validation
- Test authentication flow
- Verify all API endpoints work
- Ensure UI remains unchanged
- Test error handling

## Files to Modify

1. **Create new files:**
   - `/src/lib/api.ts` - API service layer
   - `/src/hooks/useApi.ts` - Custom hooks for API calls

2. **Modify existing files:**
   - `/src/contexts/AuthContext.tsx` - Real authentication
   - `/src/pages/Dashboard.tsx` - Dynamic data
   - `/src/pages/Analytics.tsx` - Dynamic data
   - `/src/pages/DataEntry.tsx` - Add API integration
   - `/src/components/dashboard/EmissionChart.tsx` - Dynamic props
   - `/src/components/dashboard/SectorPieChart.tsx` - Dynamic props

3. **Keep unchanged (UI/UX):**
   - All UI components in `/src/components/ui/`
   - Layout components
   - Navigation components

## API Endpoints to Use

- `POST /auth/login` - Authentication
- `GET /auth/me` - Current user info
- `GET /analytics/metrics` - Dashboard metrics
- `GET /analytics/sectors` - Sector emissions
- `GET /analytics/trends` - Monthly trends
- `GET /data/` - Monthly data entries
- `POST /data/` - Create data entry
- `PUT /data/{id}` - Update data entry
- `GET /panchayats/` - Panchayat data

## Success Criteria

1. ✅ Backend is running and accessible
2. ✅ Frontend connects to backend APIs
3. ✅ Authentication works with real backend
4. ✅ Dashboard shows dynamic data from backend
5. ✅ Analytics shows real calculated data
6. ✅ UI/UX remains identical to current design
7. ✅ Error handling for API failures
8. ✅ Loading states during API calls
