// Search domain exports (리팩토링됨)
export * from './types'
export * from './actions'
export { searchPosts } from './actions/searchPosts'
export { searchComments } from './actions/searchComments'
export { default as SearchBar } from './components/SearchBar'
export { default as SearchResults } from './components/SearchResults'
export { default as PostSearchResults } from './components/PostSearchResults'
export { default as CommentSearchResults } from './components/CommentSearchResults' 