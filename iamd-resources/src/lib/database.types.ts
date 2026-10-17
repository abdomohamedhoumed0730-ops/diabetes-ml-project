export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      chapters: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          position: number;
          subject_id: string;
          title: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          position?: number;
          subject_id: string;
          title: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          position?: number;
          subject_id?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chapters_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      favorites: {
        Row: {
          created_at: string;
          id: string;
          project_id: string | null;
          resource_id: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          project_id?: string | null;
          resource_id?: string | null;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          project_id?: string | null;
          resource_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "favorites_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "favorites_resource_id_fkey";
            columns: ["resource_id"];
            isOneToOne: false;
            referencedRelation: "resources";
            referencedColumns: ["id"];
          },
        ];
      };
      levels: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          program_id: string;
          sort_order: number;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          program_id: string;
          sort_order?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          program_id?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "levels_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          role: Database["public"]["Enums"]["user_role"];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Relationships: [];
      };
      programs: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          institution: string | null;
          is_published: boolean;
          name: string;
          short_name: string | null;
          slug: string;
          sort_order: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          institution?: string | null;
          is_published?: boolean;
          name: string;
          short_name?: string | null;
          slug: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          institution?: string | null;
          is_published?: boolean;
          name?: string;
          short_name?: string | null;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          category: Database["public"]["Enums"]["project_category"];
          created_at: string;
          created_by: string | null;
          demo_url: string | null;
          description: string | null;
          difficulty: Database["public"]["Enums"]["difficulty_level"];
          id: string;
          is_example: boolean;
          is_published: boolean;
          objectives: string | null;
          prerequisites: string | null;
          repository_url: string | null;
          slug: string;
          steps: string[];
          subject_id: string | null;
          summary: string | null;
          technologies: string[];
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          category: Database["public"]["Enums"]["project_category"];
          created_at?: string;
          created_by?: string | null;
          demo_url?: string | null;
          description?: string | null;
          difficulty?: Database["public"]["Enums"]["difficulty_level"];
          id?: string;
          is_example?: boolean;
          is_published?: boolean;
          objectives?: string | null;
          prerequisites?: string | null;
          repository_url?: string | null;
          slug: string;
          steps?: string[];
          subject_id?: string | null;
          summary?: string | null;
          technologies?: string[];
          title: string;
          updated_at?: string;
        };
        Update: {
          category?: Database["public"]["Enums"]["project_category"];
          created_at?: string;
          created_by?: string | null;
          demo_url?: string | null;
          description?: string | null;
          difficulty?: Database["public"]["Enums"]["difficulty_level"];
          id?: string;
          is_example?: boolean;
          is_published?: boolean;
          objectives?: string | null;
          prerequisites?: string | null;
          repository_url?: string | null;
          slug?: string;
          steps?: string[];
          subject_id?: string | null;
          summary?: string | null;
          technologies?: string[];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      resource_events: {
        Row: {
          created_at: string;
          id: number;
          kind: Database["public"]["Enums"]["event_kind"];
          project_id: string | null;
          resource_id: string | null;
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: never;
          kind: Database["public"]["Enums"]["event_kind"];
          project_id?: string | null;
          resource_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: never;
          kind?: Database["public"]["Enums"]["event_kind"];
          project_id?: string | null;
          resource_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "resource_events_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "resource_events_resource_id_fkey";
            columns: ["resource_id"];
            isOneToOne: false;
            referencedRelation: "resources";
            referencedColumns: ["id"];
          },
        ];
      };
      resources: {
        Row: {
          author: string | null;
          chapter_id: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          external_url: string | null;
          file_name: string | null;
          file_path: string | null;
          file_size: number | null;
          id: string;
          is_published: boolean;
          keywords: string[];
          license: string | null;
          mime_type: string | null;
          project_id: string | null;
          source: string;
          subject_id: string | null;
          title: string;
          type: Database["public"]["Enums"]["resource_type"];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          author?: string | null;
          chapter_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          external_url?: string | null;
          file_name?: string | null;
          file_path?: string | null;
          file_size?: number | null;
          id?: string;
          is_published?: boolean;
          keywords?: string[];
          license?: string | null;
          mime_type?: string | null;
          project_id?: string | null;
          source: string;
          subject_id?: string | null;
          title: string;
          type: Database["public"]["Enums"]["resource_type"];
          updated_at?: string;
        };
        Update: {
          author?: string | null;
          chapter_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          external_url?: string | null;
          file_name?: string | null;
          file_path?: string | null;
          file_size?: number | null;
          id?: string;
          is_published?: boolean;
          keywords?: string[];
          license?: string | null;
          mime_type?: string | null;
          project_id?: string | null;
          source?: string;
          subject_id?: string | null;
          title?: string;
          type?: Database["public"]["Enums"]["resource_type"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "resources_chapter_id_fkey";
            columns: ["chapter_id"];
            isOneToOne: false;
            referencedRelation: "chapters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "resources_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "resources_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      semesters: {
        Row: {
          created_at: string;
          id: string;
          level_id: string;
          name: string;
          sort_order: number;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          level_id: string;
          name: string;
          sort_order?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          level_id?: string;
          name?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "semesters_level_id_fkey";
            columns: ["level_id"];
            isOneToOne: false;
            referencedRelation: "levels";
            referencedColumns: ["id"];
          },
        ];
      };
      subjects: {
        Row: {
          created_at: string;
          icon: string;
          id: string;
          is_published: boolean;
          level_id: string;
          name: string;
          objectives: string | null;
          presentation: string | null;
          semester_id: string | null;
          short_description: string | null;
          slug: string;
          sort_order: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          icon?: string;
          id?: string;
          is_published?: boolean;
          level_id: string;
          name: string;
          objectives?: string | null;
          presentation?: string | null;
          semester_id?: string | null;
          short_description?: string | null;
          slug: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          icon?: string;
          id?: string;
          is_published?: boolean;
          level_id?: string;
          name?: string;
          objectives?: string | null;
          presentation?: string | null;
          semester_id?: string | null;
          short_description?: string | null;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subjects_level_id_fkey";
            columns: ["level_id"];
            isOneToOne: false;
            referencedRelation: "levels";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subjects_semester_id_fkey";
            columns: ["semester_id"];
            isOneToOne: false;
            referencedRelation: "semesters";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      admin_overview: { Args: { p_days?: number }; Returns: Json };
      f_unaccent: { Args: { value: string }; Returns: string };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      log_event: {
        Args: {
          p_kind: Database["public"]["Enums"]["event_kind"];
          p_project_id?: string;
          p_resource_id?: string;
        };
        Returns: undefined;
      };
      popular_resources: {
        Args: { p_limit?: number };
        Returns: {
          downloads: number;
          resource_id: string;
          views: number;
        }[];
      };
      project_is_visible: { Args: { p_project_id: string }; Returns: boolean };
      resource_is_visible: {
        Args: { p_resource_id: string };
        Returns: boolean;
      };
      search_catalog: {
        Args: {
          p_category?: Database["public"]["Enums"]["project_category"];
          p_chapter_id?: string;
          p_kind?: string;
          p_level_id?: string;
          p_limit?: number;
          p_offset?: number;
          p_query?: string;
          p_subject_id?: string;
          p_type?: Database["public"]["Enums"]["resource_type"];
        };
        Returns: {
          chapter_title: string;
          created_at: string;
          excerpt: string;
          id: string;
          is_external: boolean;
          kind: string;
          level_name: string;
          project_category: Database["public"]["Enums"]["project_category"];
          rank: number;
          resource_type: Database["public"]["Enums"]["resource_type"];
          slug: string;
          subject_name: string;
          subject_slug: string;
          title: string;
          total_count: number;
        }[];
      };
      set_user_role: {
        Args: {
          p_role: Database["public"]["Enums"]["user_role"];
          p_user_id: string;
        };
        Returns: undefined;
      };
      subject_is_visible: { Args: { p_subject_id: string }; Returns: boolean };
      to_prefix_tsquery: { Args: { p_query: string }; Returns: unknown };
    };
    Enums: {
      difficulty_level: "debutant" | "intermediaire" | "avance";
      event_kind: "view" | "download";
      project_category:
        | "ia"
        | "machine_learning"
        | "deep_learning"
        | "nlp"
        | "big_data"
        | "data_science"
        | "modelisation";
      resource_type:
        | "cours"
        | "resume"
        | "exercice"
        | "tp"
        | "examen"
        | "projet"
        | "dataset"
        | "capture"
        | "lien"
        | "autre";
      user_role: "admin" | "student";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      difficulty_level: ["debutant", "intermediaire", "avance"],
      event_kind: ["view", "download"],
      project_category: [
        "ia",
        "machine_learning",
        "deep_learning",
        "nlp",
        "big_data",
        "data_science",
        "modelisation",
      ],
      resource_type: [
        "cours",
        "resume",
        "exercice",
        "tp",
        "examen",
        "projet",
        "dataset",
        "capture",
        "lien",
        "autre",
      ],
      user_role: ["admin", "student"],
    },
  },
} as const;
