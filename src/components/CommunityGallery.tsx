import { useState } from "react"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Input } from "./ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { 
  Search, 
  Heart, 
  MessageCircle, 
  Share, 
  Bookmark,
  Trophy,
  Eye,
  Palette,
  Award
} from "lucide-react"
import { useAuth } from "./AuthContext"
import { ImageWithFallback } from "./figma/ImageWithFallback"
import { toast } from "sonner"

interface Artwork {
  id: string
  title: string
  description: string
  image: string
  artist: {
    name: string
    avatar: string
    level: string
  }
  course: string
  category: string
  createdAt: string
  likes: number
  comments: number
  views: number
  featured: boolean
  liked?: boolean
  bookmarked?: boolean
  tags: string[]
}

export function CommunityGallery() {
  const { user } = useAuth()
  void user
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedSort, setSelectedSort] = useState("recent")
  const [activeTab, setActiveTab] = useState("recent")

  // Mock artwork data
  const artworks: Artwork[] = [
    {
      id: '1',
      title: 'Mystic Forest Landscape',
      description: 'A serene forest scene practicing light and shadow techniques from the Digital Painting Fundamentals course.',
      image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=400&fit=crop',
      artist: {
        name: 'Maya Chen',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b789?w=40&h=40&fit=crop&crop=face',
        level: 'Intermediate'
      },
      course: 'Digital Painting Fundamentals',
      category: 'Landscape',
      createdAt: '2 hours ago',
      likes: 24,
      comments: 8,
      views: 156,
      featured: true,
      liked: true,
      tags: ['digital art', 'landscape', 'forest', 'lighting']
    },
    {
      id: '2',
      title: 'Warrior Character Design',
      description: 'Final character design project showcasing armor design and storytelling elements.',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop',
      artist: {
        name: 'Alex Rivera',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
        level: 'Advanced'
      },
      course: 'Character Design Workshop',
      category: 'Character Design',
      createdAt: '5 hours ago',
      likes: 42,
      comments: 12,
      views: 289,
      featured: true,
      bookmarked: true,
      tags: ['character design', 'warrior', 'armor', 'concept art']
    },
    {
      id: '3',
      title: 'Color Harmony Study',
      description: 'Exploring complementary color relationships through abstract composition.',
      image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&h=400&fit=crop',
      artist: {
        name: 'Emma Thompson',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face',
        level: 'Beginner'
      },
      course: 'Advanced Color Theory',
      category: 'Abstract',
      createdAt: '1 day ago',
      likes: 18,
      comments: 5,
      views: 134,
      featured: false,
      tags: ['color theory', 'abstract', 'harmony', 'study']
    },
    {
      id: '4',
      title: 'Portrait Study - Digital',
      description: 'Practice piece focusing on facial structure and digital painting techniques.',
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=400&fit=crop',
      artist: {
        name: 'David Park',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
        level: 'Intermediate'
      },
      course: 'Portrait Drawing Basics',
      category: 'Portrait',
      createdAt: '2 days ago',
      likes: 31,
      comments: 9,
      views: 203,
      featured: false,
      liked: true,
      tags: ['portrait', 'digital art', 'face', 'study']
    },
    {
      id: '5',
      title: 'Sci-Fi Environment Concept',
      description: 'Futuristic cityscape created as part of the Environment Art Masterclass final project.',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
      artist: {
        name: 'Sofia Chen',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b789?w=40&h=40&fit=crop&crop=face',
        level: 'Advanced'
      },
      course: 'Environment Art Masterclass',
      category: 'Environment',
      createdAt: '3 days ago',
      likes: 67,
      comments: 15,
      views: 412,
      featured: true,
      bookmarked: true,
      tags: ['sci-fi', 'environment', 'cityscape', 'concept art']
    },
    {
      id: '6',
      title: 'Animated Character Walk Cycle',
      description: 'First attempt at character animation using the 12 principles of animation.',
      image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&h=400&fit=crop',
      artist: {
        name: 'Marcus Johnson',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face',
        level: 'Beginner'
      },
      course: 'Animation Principles',
      category: 'Animation',
      createdAt: '1 week ago',
      likes: 23,
      comments: 7,
      views: 178,
      featured: false,
      tags: ['animation', 'walk cycle', 'character', 'principles']
    }
  ]

  const categories = [...new Set(artworks.map(art => art.category))]
  const featuredArtworks = artworks.filter(art => art.featured)
  const popularArtworks = [...artworks].sort((a, b) => b.likes - a.likes)
  const recentArtworks = [...artworks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const filteredArtworks = artworks.filter(artwork => {
    const matchesSearch = artwork.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         artwork.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         artwork.artist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         artwork.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === "all" || artwork.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const handleLike = (artworkId: string) => {
    void artworkId
    toast("Liked artwork! ✨", {
      description: "Artist earned 3 tokens from your appreciation"
    })
  }

  const handleComment = (artworkId: string) => {
    void artworkId
    toast("Comment feature coming soon!", {
      description: "You'll be able to leave constructive feedback"
    })
  }

  const handleShare = (artworkId: string) => {
    void artworkId
    toast("Link copied to clipboard!", {
      description: "Share this artwork with others"
    })
  }

  const handleBookmark = (artworkId: string) => {
    void artworkId
    toast("Added to bookmarks!", {
      description: "View saved artwork in your profile"
    })
  }

  // mark handlers as used to avoid TS6133
  void [handleLike, handleComment, handleShare, handleBookmark]

  const ArtworkCard = ({ artwork }: { artwork: Artwork }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-all group">
      <div className="relative">
        <ImageWithFallback
          src={artwork.image}
          alt={artwork.title}
          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {artwork.featured && (
          <Badge className="absolute top-3 left-3 bg-yellow-500">
            <Award className="size-3 mr-1" />
            Featured
          </Badge>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="sm" variant="secondary" onClick={() => handleBookmark(artwork.id)}>
            <Bookmark className="size-3" />
          </Button>
          <Button size="sm" variant="secondary" onClick={() => handleShare(artwork.id)}>
            <Share className="size-3" />
          </Button>
        </div>
      </div>
      
      <CardContent className="p-4 space-y-3">
        <div className="space-y-2">
          <h3 className="font-medium line-clamp-1">{artwork.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{artwork.description}</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="size-6">
              <AvatarImage src={artwork.artist.avatar} alt={artwork.artist.name} />
              <AvatarFallback>{artwork.artist.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{artwork.artist.name}</p>
              <p className="text-xs text-muted-foreground">{artwork.artist.level}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {artwork.category}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{artwork.course}</span>
          <span className="text-muted-foreground">{artwork.createdAt}</span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleLike(artwork.id)}
              className={artwork.liked ? "text-red-500" : ""}
            >
              <Heart className={`size-4 mr-1 ${artwork.liked ? 'fill-current' : ''}`} />
              {artwork.likes}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleComment(artwork.id)}>
              <MessageCircle className="size-4 mr-1" />
              {artwork.comments}
            </Button>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Eye className="size-3" />
            <span className="text-xs">{artwork.views}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {artwork.tags.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              #{tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Community Gallery</h1>
          <p className="text-muted-foreground">Discover amazing artwork from our learning community</p>
        </div>
        <Button>
          <Palette className="size-4 mr-2" />
          Submit Artwork
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search artwork, artists, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedSort} onValueChange={setSelectedSort}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Recent</SelectItem>
                  <SelectItem value="popular">Popular</SelectItem>
                  <SelectItem value="views">Most Viewed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="popular">Popular</TabsTrigger>
          <TabsTrigger value="all">All Artwork</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentArtworks.slice(0, 6).map(artwork => (
              <ArtworkCard key={artwork.id} artwork={artwork} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="featured" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredArtworks.map(artwork => (
              <ArtworkCard key={artwork.id} artwork={artwork} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="popular" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularArtworks.slice(0, 6).map(artwork => (
              <ArtworkCard key={artwork.id} artwork={artwork} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArtworks.map(artwork => (
              <ArtworkCard key={artwork.id} artwork={artwork} />
            ))}
          </div>
          
          {filteredArtworks.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Palette className="size-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No artwork found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filter criteria
                </p>
                <Button variant="outline" onClick={() => {
                  setSearchTerm("")
                  setSelectedCategory("all")
                }}>
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Community Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center size-12 bg-purple-100 rounded-full mb-2 mx-auto">
              <Palette className="size-6 text-purple-600" />
            </div>
            <p className="text-2xl font-medium">247</p>
            <p className="text-sm text-muted-foreground">Artworks Shared</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center size-12 bg-red-100 rounded-full mb-2 mx-auto">
              <Heart className="size-6 text-red-600" />
            </div>
            <p className="text-2xl font-medium">1.2k</p>
            <p className="text-sm text-muted-foreground">Total Likes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center size-12 bg-blue-100 rounded-full mb-2 mx-auto">
              <MessageCircle className="size-6 text-blue-600" />
            </div>
            <p className="text-2xl font-medium">486</p>
            <p className="text-sm text-muted-foreground">Comments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center size-12 bg-yellow-100 rounded-full mb-2 mx-auto">
              <Trophy className="size-6 text-yellow-600" />
            </div>
            <p className="text-2xl font-medium">15</p>
            <p className="text-sm text-muted-foreground">Featured This Month</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}