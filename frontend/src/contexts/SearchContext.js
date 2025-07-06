import React, { createContext, useContext, useState } from 'react';

const SearchContext = createContext();

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

export const SearchProvider = ({ children }) => {
  const [searchParams, setSearchParams] = useState({
    city: '',
    checkinDate: null,
    checkoutDate: null,
    guests: 1,
    minPrice: '',
    maxPrice: '',
    minRating: '',
    roomType: ''
  });

  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  const updateSearchParams = (newParams) => {
    setSearchParams(prev => ({
      ...prev,
      ...newParams
    }));
  };

  const clearSearch = () => {
    setSearchParams({
      city: '',
      checkinDate: null,
      checkoutDate: null,
      guests: 1,
      minPrice: '',
      maxPrice: '',
      minRating: '',
      roomType: ''
    });
    setSearchResults([]);
    setPagination({
      page: 1,
      limit: 10,
      total: 0,
      pages: 0
    });
  };

  const hasActiveSearch = () => {
    return (
      searchParams.city ||
      searchParams.checkinDate ||
      searchParams.checkoutDate ||
      searchParams.minPrice ||
      searchParams.maxPrice ||
      searchParams.minRating ||
      searchParams.roomType
    );
  };

  const getSearchQuery = () => {
    const query = {};
    
    if (searchParams.city) query.city = searchParams.city;
    if (searchParams.checkinDate) query.checkinDate = searchParams.checkinDate.toISOString();
    if (searchParams.checkoutDate) query.checkoutDate = searchParams.checkoutDate.toISOString();
    if (searchParams.guests) query.guests = searchParams.guests;
    if (searchParams.minPrice) query.minPrice = searchParams.minPrice;
    if (searchParams.maxPrice) query.maxPrice = searchParams.maxPrice;
    if (searchParams.minRating) query.minRating = searchParams.minRating;
    if (searchParams.roomType) query.roomType = searchParams.roomType;
    
    query.page = pagination.page;
    query.limit = pagination.limit;
    
    return query;
  };

  const value = {
    searchParams,
    searchResults,
    loading,
    pagination,
    updateSearchParams,
    clearSearch,
    hasActiveSearch,
    getSearchQuery,
    setSearchResults,
    setLoading,
    setPagination
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};