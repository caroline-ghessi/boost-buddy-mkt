import { Card } from "@/components/ui/card";
import { ExternalLink, Heart, MessageCircle } from "lucide-react";

interface Post {
  url: string;
  caption: string;
  likesCount: number;
  commentsCount: number;
  timestamp: string;
}

interface PostsGridProps {
  posts: Post[];
}

export function PostsGrid({ posts }: PostsGridProps) {
  if (!posts || posts.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-center">
          Nenhum post disponível ainda.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {posts.slice(0, 9).map((post, i) => (
        <Card key={i} className="p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-2">
            <span className="text-xs text-muted-foreground">
              {new Date(post.timestamp).toLocaleDateString('pt-BR')}
            </span>
            <a 
              href={post.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          
          <p className="text-sm line-clamp-3 mb-3 text-muted-foreground">
            {post.caption || "Sem legenda"}
          </p>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              {post.likesCount?.toLocaleString() || 0}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              {post.commentsCount?.toLocaleString() || 0}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}
