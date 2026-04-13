declare module "@mailchimp/mailchimp_marketing" {
  interface Config {
    apiKey?: string;
    server?: string;
  }

  interface ListsAPI {
    setListMember(listId: string, subscriberHash: string, body: unknown): Promise<unknown>;
    getListMember(listId: string, subscriberHash: string): Promise<unknown>;
    getListMembersInfo(listId: string, opts?: unknown): Promise<unknown>;
    updateListMemberTags(listId: string, subscriberHash: string, body: unknown): Promise<unknown>;
    getAllLists(): Promise<{ lists: Array<{ id: string; name: string; stats: { member_count: number } }> }>;
    getListMergeFields(listId: string): Promise<{ merge_fields: Array<{ tag: string; name: string; type: string }> }>;
    addListMergeField(listId: string, body: unknown): Promise<unknown>;
  }

  const lists: ListsAPI;
  function setConfig(config: Config): void;

  namespace lists {
    interface SetListMemberBody {
      email_address: string;
      status_if_new: string;
      status: string;
      merge_fields?: Record<string, unknown>;
    }
  }
}
