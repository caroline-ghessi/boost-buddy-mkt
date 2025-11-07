export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ads_accounts: {
        Row: {
          account_id: string
          account_name: string | null
          created_at: string
          credentials: Json
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          platform: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          account_name?: string | null
          created_at?: string
          credentials: Json
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          platform: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          account_name?: string | null
          created_at?: string
          credentials?: Json
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          platform?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ads_metrics: {
        Row: {
          ads_account_id: string
          campaign_id: string
          clicks: number | null
          conversions: number | null
          cpa: number | null
          cpc: number | null
          created_at: string
          ctr: number | null
          date: string
          external_campaign_id: string
          id: string
          impressions: number | null
          metadata: Json | null
          revenue: number | null
          roas: number | null
          spend: number | null
        }
        Insert: {
          ads_account_id: string
          campaign_id: string
          clicks?: number | null
          conversions?: number | null
          cpa?: number | null
          cpc?: number | null
          created_at?: string
          ctr?: number | null
          date: string
          external_campaign_id: string
          id?: string
          impressions?: number | null
          metadata?: Json | null
          revenue?: number | null
          roas?: number | null
          spend?: number | null
        }
        Update: {
          ads_account_id?: string
          campaign_id?: string
          clicks?: number | null
          conversions?: number | null
          cpa?: number | null
          cpc?: number | null
          created_at?: string
          ctr?: number | null
          date?: string
          external_campaign_id?: string
          id?: string
          impressions?: number | null
          metadata?: Json | null
          revenue?: number | null
          roas?: number | null
          spend?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ads_metrics_ads_account_id_fkey"
            columns: ["ads_account_id"]
            isOneToOne: false
            referencedRelation: "ads_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ads_metrics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_communications: {
        Row: {
          campaign_id: string | null
          content: string
          context: Json | null
          created_at: string
          from_agent: string
          id: string
          requires_response: boolean | null
          responded_at: string | null
          task_id: string | null
          to_agent: string
          type: Database["public"]["Enums"]["communication_type"]
        }
        Insert: {
          campaign_id?: string | null
          content: string
          context?: Json | null
          created_at?: string
          from_agent: string
          id?: string
          requires_response?: boolean | null
          responded_at?: string | null
          task_id?: string | null
          to_agent: string
          type: Database["public"]["Enums"]["communication_type"]
        }
        Update: {
          campaign_id?: string | null
          content?: string
          context?: Json | null
          created_at?: string
          from_agent?: string
          id?: string
          requires_response?: boolean | null
          responded_at?: string | null
          task_id?: string | null
          to_agent?: string
          type?: Database["public"]["Enums"]["communication_type"]
        }
        Relationships: [
          {
            foreignKeyName: "agent_communications_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_communications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "agent_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_configs: {
        Row: {
          agent_id: string
          avatar: string | null
          breed: string
          breed_trait: string
          created_at: string
          emoji: string
          id: string
          is_active: boolean | null
          level: Database["public"]["Enums"]["agent_level"]
          llm_model: string | null
          max_tokens: number | null
          name: string
          role: string
          specialty: string[] | null
          system_prompt: string
          team: string
          temperature: number | null
          updated_at: string
          years_experience: number | null
        }
        Insert: {
          agent_id: string
          avatar?: string | null
          breed: string
          breed_trait: string
          created_at?: string
          emoji: string
          id?: string
          is_active?: boolean | null
          level: Database["public"]["Enums"]["agent_level"]
          llm_model?: string | null
          max_tokens?: number | null
          name: string
          role: string
          specialty?: string[] | null
          system_prompt: string
          team: string
          temperature?: number | null
          updated_at?: string
          years_experience?: number | null
        }
        Update: {
          agent_id?: string
          avatar?: string | null
          breed?: string
          breed_trait?: string
          created_at?: string
          emoji?: string
          id?: string
          is_active?: boolean | null
          level?: Database["public"]["Enums"]["agent_level"]
          llm_model?: string | null
          max_tokens?: number | null
          name?: string
          role?: string
          specialty?: string[] | null
          system_prompt?: string
          team?: string
          temperature?: number | null
          updated_at?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      agent_jobs: {
        Row: {
          agent_id: string
          attempts: number
          campaign_id: string | null
          completed_at: string | null
          created_at: string
          enqueued_at: string
          error_message: string | null
          id: string
          job_type: string
          max_attempts: number
          payload: Json
          priority: number
          result: Json | null
          started_at: string | null
          status: string
          task_id: string | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          attempts?: number
          campaign_id?: string | null
          completed_at?: string | null
          created_at?: string
          enqueued_at?: string
          error_message?: string | null
          id?: string
          job_type: string
          max_attempts?: number
          payload?: Json
          priority?: number
          result?: Json | null
          started_at?: string | null
          status?: string
          task_id?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          attempts?: number
          campaign_id?: string | null
          completed_at?: string | null
          created_at?: string
          enqueued_at?: string
          error_message?: string | null
          id?: string
          job_type?: string
          max_attempts?: number
          payload?: Json
          priority?: number
          result?: Json | null
          started_at?: string | null
          status?: string
          task_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_jobs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_jobs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "agent_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_prompt_history: {
        Row: {
          agent_config_id: string
          change_reason: string | null
          changed_by: string | null
          created_at: string
          id: string
          system_prompt: string
          version: number
        }
        Insert: {
          agent_config_id: string
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string
          id?: string
          system_prompt: string
          version: number
        }
        Update: {
          agent_config_id?: string
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string
          id?: string
          system_prompt?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "agent_prompt_history_agent_config_id_fkey"
            columns: ["agent_config_id"]
            isOneToOne: false
            referencedRelation: "agent_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_tasks: {
        Row: {
          agent_id: string
          assigned_by: string | null
          campaign_id: string
          completed_at: string | null
          context: Json | null
          created_at: string
          description: string
          id: string
          parent_task_id: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          result: Json | null
          started_at: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          assigned_by?: string | null
          campaign_id: string
          completed_at?: string | null
          context?: Json | null
          created_at?: string
          description: string
          id?: string
          parent_task_id?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          result?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          assigned_by?: string | null
          campaign_id?: string
          completed_at?: string | null
          context?: Json | null
          created_at?: string
          description?: string
          id?: string
          parent_task_id?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          result?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_tasks_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "agent_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_allocations: {
        Row: {
          allocated_amount: number
          budget_plan_id: string
          business_front_id: string
          created_at: string
          id: string
          notes: string | null
          percentage: number
        }
        Insert: {
          allocated_amount?: number
          budget_plan_id: string
          business_front_id: string
          created_at?: string
          id?: string
          notes?: string | null
          percentage?: number
        }
        Update: {
          allocated_amount?: number
          budget_plan_id?: string
          business_front_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "budget_allocations_budget_plan_id_fkey"
            columns: ["budget_plan_id"]
            isOneToOne: false
            referencedRelation: "budget_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_allocations_business_front_id_fkey"
            columns: ["business_front_id"]
            isOneToOne: false
            referencedRelation: "business_fronts"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_plans: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          period_end: string
          period_start: string
          status: string
          total_budget: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          period_end: string
          period_start: string
          status?: string
          total_budget?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          period_end?: string
          period_start?: string
          status?: string
          total_budget?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      business_fronts: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      campaign_assets: {
        Row: {
          approved: boolean | null
          approved_at: string | null
          approved_by: string | null
          asset_type: Database["public"]["Enums"]["asset_type"]
          campaign_id: string
          content: string | null
          created_at: string
          created_by_agent: string
          file_size: number | null
          file_url: string | null
          id: string
          metadata: Json | null
          mime_type: string | null
          task_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          asset_type: Database["public"]["Enums"]["asset_type"]
          campaign_id: string
          content?: string | null
          created_at?: string
          created_by_agent: string
          file_size?: number | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          task_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          asset_type?: Database["public"]["Enums"]["asset_type"]
          campaign_id?: string
          content?: string | null
          created_at?: string
          created_by_agent?: string
          file_size?: number | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          task_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_assets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_assets_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "agent_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          budget_allocated: number | null
          budget_total: number | null
          channels: string[] | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          kpis: Json | null
          metadata: Json | null
          name: string
          objectives: string[] | null
          start_date: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          target_audience: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_allocated?: number | null
          budget_total?: number | null
          channels?: string[] | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          kpis?: Json | null
          metadata?: Json | null
          name: string
          objectives?: string[] | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          target_audience?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_allocated?: number | null
          budget_total?: number | null
          channels?: string[] | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          kpis?: Json | null
          metadata?: Json | null
          name?: string
          objectives?: string[] | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          target_audience?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cmo_conversations: {
        Row: {
          campaign_id: string | null
          content: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cmo_conversations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_data: {
        Row: {
          competitor_name: string
          created_at: string
          data: Json
          data_type: string
          id: string
          platform: string
          scraped_at: string
          user_id: string
        }
        Insert: {
          competitor_name: string
          created_at?: string
          data: Json
          data_type: string
          id?: string
          platform: string
          scraped_at: string
          user_id: string
        }
        Update: {
          competitor_name?: string
          created_at?: string
          data?: Json
          data_type?: string
          id?: string
          platform?: string
          scraped_at?: string
          user_id?: string
        }
        Relationships: []
      }
      geographic_distributions: {
        Row: {
          amount: number
          created_at: string
          google_daily: number | null
          google_monthly: number | null
          id: string
          meta_daily: number | null
          meta_monthly: number | null
          percentage: number
          platform_distribution_id: string
          state_code: string
        }
        Insert: {
          amount?: number
          created_at?: string
          google_daily?: number | null
          google_monthly?: number | null
          id?: string
          meta_daily?: number | null
          meta_monthly?: number | null
          percentage?: number
          platform_distribution_id: string
          state_code: string
        }
        Update: {
          amount?: number
          created_at?: string
          google_daily?: number | null
          google_monthly?: number | null
          id?: string
          meta_daily?: number | null
          meta_monthly?: number | null
          percentage?: number
          platform_distribution_id?: string
          state_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "geographic_distributions_platform_distribution_id_fkey"
            columns: ["platform_distribution_id"]
            isOneToOne: false
            referencedRelation: "platform_distributions"
            referencedColumns: ["id"]
          },
        ]
      }
      google_ads_metrics: {
        Row: {
          campaign_id: string
          campaign_name: string
          clicks: number
          conversion_rate: number | null
          conversions: number
          cost: number
          cost_per_conversion: number | null
          cpc: number | null
          created_at: string
          ctr: number | null
          date: string
          id: string
          impressions: number
          metadata: Json | null
          user_id: string
        }
        Insert: {
          campaign_id: string
          campaign_name: string
          clicks?: number
          conversion_rate?: number | null
          conversions?: number
          cost?: number
          cost_per_conversion?: number | null
          cpc?: number | null
          created_at?: string
          ctr?: number | null
          date: string
          id?: string
          impressions?: number
          metadata?: Json | null
          user_id: string
        }
        Update: {
          campaign_id?: string
          campaign_name?: string
          clicks?: number
          conversion_rate?: number | null
          conversions?: number
          cost?: number
          cost_per_conversion?: number | null
          cpc?: number | null
          created_at?: string
          ctr?: number | null
          date?: string
          id?: string
          impressions?: number
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      google_analytics_metrics: {
        Row: {
          avg_session_duration: number | null
          bounce_rate: number | null
          conversion_rate: number | null
          conversions: number
          created_at: string
          date: string
          id: string
          metadata: Json | null
          new_users: number
          pageviews: number
          sessions: number
          traffic_sources: Json | null
          user_id: string
          users: number
        }
        Insert: {
          avg_session_duration?: number | null
          bounce_rate?: number | null
          conversion_rate?: number | null
          conversions?: number
          created_at?: string
          date: string
          id?: string
          metadata?: Json | null
          new_users?: number
          pageviews?: number
          sessions?: number
          traffic_sources?: Json | null
          user_id: string
          users?: number
        }
        Update: {
          avg_session_duration?: number | null
          bounce_rate?: number | null
          conversion_rate?: number | null
          conversions?: number
          created_at?: string
          date?: string
          id?: string
          metadata?: Json | null
          new_users?: number
          pageviews?: number
          sessions?: number
          traffic_sources?: Json | null
          user_id?: string
          users?: number
        }
        Relationships: []
      }
      google_credentials: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          id: string
          refresh_token: string
          scope: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          id?: string
          refresh_token: string
          scope: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          id?: string
          refresh_token?: string
          scope?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meta_ads_metrics: {
        Row: {
          campaign_id: string
          campaign_name: string
          clicks: number
          conversion_rate: number | null
          conversions: number
          cost: number
          cost_per_conversion: number | null
          cpc: number | null
          cpm: number | null
          created_at: string
          ctr: number | null
          date: string
          id: string
          impressions: number
          metadata: Json | null
          reach: number
          user_id: string
        }
        Insert: {
          campaign_id: string
          campaign_name: string
          clicks?: number
          conversion_rate?: number | null
          conversions?: number
          cost?: number
          cost_per_conversion?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string
          ctr?: number | null
          date: string
          id?: string
          impressions?: number
          metadata?: Json | null
          reach?: number
          user_id: string
        }
        Update: {
          campaign_id?: string
          campaign_name?: string
          clicks?: number
          conversion_rate?: number | null
          conversions?: number
          cost?: number
          cost_per_conversion?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string
          ctr?: number | null
          date?: string
          id?: string
          impressions?: number
          metadata?: Json | null
          reach?: number
          user_id?: string
        }
        Relationships: []
      }
      platform_distributions: {
        Row: {
          budget_allocation_id: string
          created_at: string
          daily_amount: number
          id: string
          monthly_amount: number
          percentage: number
          platform: string
        }
        Insert: {
          budget_allocation_id: string
          created_at?: string
          daily_amount?: number
          id?: string
          monthly_amount?: number
          percentage?: number
          platform: string
        }
        Update: {
          budget_allocation_id?: string
          created_at?: string
          daily_amount?: number
          id?: string
          monthly_amount?: number
          percentage?: number
          platform?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_distributions_budget_allocation_id_fkey"
            columns: ["budget_allocation_id"]
            isOneToOne: false
            referencedRelation: "budget_allocations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      rag_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          document_id: string
          id: string
          metadata: Json | null
          token_count: number | null
          user_id: string
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string
          document_id: string
          id?: string
          metadata?: Json | null
          token_count?: number | null
          user_id: string
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          document_id?: string
          id?: string
          metadata?: Json | null
          token_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rag_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "rag_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      rag_documents: {
        Row: {
          category: string | null
          chunk_count: number | null
          created_at: string
          description: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          last_processed_at: string | null
          metadata: Json | null
          needs_reprocessing: boolean | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          chunk_count?: number | null
          created_at?: string
          description?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          last_processed_at?: string | null
          metadata?: Json | null
          needs_reprocessing?: boolean | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          chunk_count?: number | null
          created_at?: string
          description?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          last_processed_at?: string | null
          metadata?: Json | null
          needs_reprocessing?: boolean | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rag_embeddings: {
        Row: {
          chunk_id: string
          created_at: string
          embedding: string
          id: string
          user_id: string
        }
        Insert: {
          chunk_id: string
          created_at?: string
          embedding: string
          id?: string
          user_id: string
        }
        Update: {
          chunk_id?: string
          created_at?: string
          embedding?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rag_embeddings_chunk_id_fkey"
            columns: ["chunk_id"]
            isOneToOne: true
            referencedRelation: "rag_chunks"
            referencedColumns: ["id"]
          },
        ]
      }
      social_media_metrics: {
        Row: {
          created_at: string | null
          date: string
          engagement_rate: number | null
          followers: number | null
          followers_change: number | null
          following: number | null
          id: string
          metadata: Json | null
          platform: string
          posts_count: number | null
          posts_published: number | null
          profile_handle: string
          scraped_at: string
          total_comments: number | null
          total_likes: number | null
          total_shares: number | null
          total_views: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          engagement_rate?: number | null
          followers?: number | null
          followers_change?: number | null
          following?: number | null
          id?: string
          metadata?: Json | null
          platform: string
          posts_count?: number | null
          posts_published?: number | null
          profile_handle: string
          scraped_at: string
          total_comments?: number | null
          total_likes?: number | null
          total_shares?: number | null
          total_views?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          engagement_rate?: number | null
          followers?: number | null
          followers_change?: number | null
          following?: number | null
          id?: string
          metadata?: Json | null
          platform?: string
          posts_count?: number | null
          posts_published?: number | null
          profile_handle?: string
          scraped_at?: string
          total_comments?: number | null
          total_likes?: number | null
          total_shares?: number | null
          total_views?: number | null
          user_id?: string
        }
        Relationships: []
      }
      sync_job_runs: {
        Row: {
          created_at: string
          error_message: string | null
          finished_at: string | null
          id: string
          job_name: string
          metadata: Json | null
          rows_processed: number | null
          source: string
          started_at: string
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          job_name: string
          metadata?: Json | null
          rows_processed?: number | null
          source: string
          started_at?: string
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          job_name?: string
          metadata?: Json | null
          rows_processed?: number | null
          source?: string
          started_at?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_agent_queue_health: {
        Row: {
          avg_attempts: number | null
          count: number | null
          newest_job: string | null
          oldest_job: string | null
          status: string | null
        }
        Relationships: []
      }
      v_sync_health: {
        Row: {
          avg_duration_seconds: number | null
          failed_count_24h: number | null
          failed_count_7d: number | null
          last_failure_at: string | null
          last_success_at: string | null
          source: string | null
          success_count_24h: number | null
          success_count_7d: number | null
          total_rows_7d: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      match_rag_chunks: {
        Args: {
          filter_user_id?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          chunk_id: string
          content: string
          document_id: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      reprocess_document: { Args: { document_id: string }; Returns: Json }
    }
    Enums: {
      agent_level: "level_1" | "level_2" | "level_3" | "level_4"
      app_role: "admin" | "user"
      asset_type: "text" | "image" | "video" | "audio" | "other"
      campaign_status:
        | "draft"
        | "planning"
        | "in_progress"
        | "review"
        | "active"
        | "paused"
        | "completed"
        | "cancelled"
      communication_type:
        | "task"
        | "question"
        | "result"
        | "feedback"
        | "approval"
      priority_level: "low" | "medium" | "high" | "urgent"
      task_status:
        | "pending"
        | "assigned"
        | "in_progress"
        | "completed"
        | "failed"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      agent_level: ["level_1", "level_2", "level_3", "level_4"],
      app_role: ["admin", "user"],
      asset_type: ["text", "image", "video", "audio", "other"],
      campaign_status: [
        "draft",
        "planning",
        "in_progress",
        "review",
        "active",
        "paused",
        "completed",
        "cancelled",
      ],
      communication_type: [
        "task",
        "question",
        "result",
        "feedback",
        "approval",
      ],
      priority_level: ["low", "medium", "high", "urgent"],
      task_status: [
        "pending",
        "assigned",
        "in_progress",
        "completed",
        "failed",
        "cancelled",
      ],
    },
  },
} as const
