export type XianglingConfig = {
    bot_name: string;
    official_website: string;
    official_group: string;
    operator: string;
    admin: {
        state_as_default: boolean;
        render_scale: number;
    };
    notice: {
        private_message: boolean;
        group_message: boolean;
        group_temporary_message: boolean;
        group_recall: boolean;
        private_recall: boolean;
        friend_request: boolean;
        group_invite_request: boolean;
        add_group_application: boolean;
        group_admin_change: boolean;
        friend_number_change: boolean;
        group_number_change: boolean;
        group_member_number_change: boolean;
        bot_been_banned: boolean;
        msg_save_deltime: number;
        notifications_all: boolean;
    };
    group_lists: {
        black: string[];
        white: string[];
        black_managers: string[];
        white_auto_unban: boolean;
    };
    group_vote: {
        vote_ban: boolean;
        vote_kick: boolean;
        out_time: number;
        min_num: number;
        ban_time: number;
        veto: boolean;
        vote_admin: boolean;
    };
    group_verify: {
        groups: Record<string, {
            mode: '计算' | '提交';
        }>;
        time: number;
        times: number;
        delay_time: number;
        remind_at_last_minute: boolean;
        range: {
            min: number;
            max: number;
        };
    };
    group_add_notice: {
        open_groups: string[];
        message: string;
    };
    welcome: {
        enabled: boolean;
        welcome_text: string[];
        exit_text: string[];
        welcome_cooldown: number;
        default_welcome: string;
        default_exit: string;
        default_kick: string;
        bot_join_text: string;
    };
    feedback: {
        enabled: boolean;
        groups: string[];
    };
    group_recall: {
        bot: 'all' | 'admin' | 'owner' | 'master';
        member: 'all' | 'admin' | 'owner' | 'master';
    };
    group_manage: {
        auto_approve_group_invite: boolean;
    };
};
export declare const getXianglingConfig: () => XianglingConfig;
export declare const getBotName: () => string;
