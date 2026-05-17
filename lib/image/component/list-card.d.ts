import React from 'react';
export type ListCardItem = {
    title: string;
    subtitle?: string;
    content: string;
    tags?: string[];
};
export type ListCardData = {
    title: string;
    subTitle: string;
    summary?: string[];
    emptyText?: string;
    items: ListCardItem[];
    footer?: string;
};
export default function ListCardImage({ data }: {
    data: ListCardData;
}): React.JSX.Element;
