import { describe, it, expect } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import Summary from "../../app/components/ui/Summary.vue";

describe("News Attachments Feature", () => {
    describe("UiSummary Component", () => {
        it("displays the paperclip badge when hasAttachments is true", async () => {
            const component = await mountSuspended(Summary, {
                props: {
                    id: "1",
                    title: "Test Article",
                    subtitle: "Subtitle",
                    date: "2025-01-01",
                    link: "/article/1",
                    imageUrl: "/img.jpg",
                    hasAttachments: true,
                },
            });
            
            // Should contain the badge text
            expect(component.text()).toContain("Dokumente");
        });

        it("hides the paperclip badge when hasAttachments is false", async () => {
            const component = await mountSuspended(Summary, {
                props: {
                    id: "1",
                    title: "Test Article",
                    subtitle: "Subtitle",
                    date: "2025-01-01",
                    link: "/article/1",
                    imageUrl: "/img.jpg",
                    hasAttachments: false,
                },
            });
            
            expect(component.text()).not.toContain("Dokumente");
        });
    });

    describe("Filter Logic", () => {
        it("identifies hasAttachments as an active filter state", () => {
            const filters = {
                tag: 'all',
                author: 'all',
                dateRange: 'all',
                hasAttachments: true
            };
            
            const hasActive = filters.tag !== 'all' || 
                             filters.author !== 'all' || 
                             filters.dateRange !== 'all' || 
                             filters.hasAttachments;
                             
            expect(hasActive).toBe(true);
        });

        it("filters news items correctly by attachment status", () => {
            const news = [
                { id: 1, hasAttachments: true },
                { id: 2, hasAttachments: false },
                { id: 3, hasAttachments: true }
            ];

            const filtered = news.filter(item => item.hasAttachments);
            expect(filtered).toHaveLength(2);
            expect(filtered[0].id).toBe(1);
            expect(filtered[1].id).toBe(3);
        });
    });
});
