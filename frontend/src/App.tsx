import {useState} from "react";
import {ThemeProvider} from "@/components/theme-provider";
import {Toaster} from "@/components/ui/sonner";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup, SidebarGroupContent,
    SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
    SidebarProvider
} from "@/components/ui/sidebar.tsx";

import HistoryView from "@/components/views/HistoryView.tsx";
import DetectionView from "@/components/views/DetectionView.tsx";

import {LayoutDashboard, LucideHistory} from "lucide-react";

export default function App() {
    const [activeTab, setActiveTab] = useState("detection");

    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <Toaster richColors position="bottom-right"/>
            <SidebarProvider>
                <Sidebar className={"p-5 bg-sidebar"}>
                    <SidebarHeader>
                        <div className="flex items-center gap-3 px-2">
                            <div className="bg-primary p-2 rounded-xl text-primary-foreground">
                            </div>
                            <span className="font-bold text-xl tracking-tight">WeaponDetect</span>
                        </div>
                    </SidebarHeader>

                    <SidebarContent>
                        <SidebarGroup>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            isActive={activeTab === "detection"}
                                            onClick={() => setActiveTab("detection")}
                                        >
                                            <LayoutDashboard size={18}/>
                                            <span>Детекция</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>

                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            isActive={activeTab === "history"}
                                            onClick={() => setActiveTab("history")}
                                        >
                                            <LucideHistory size={18}/>
                                            <span>Статистика</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>
                </Sidebar>

                <div className="max-w-6xl mx-auto p-8 flex flex-col flex-1 lg:h-screen lg:overflow-y-hidden">
                    {{
                        detection: <DetectionView />,
                        history: <HistoryView />,
                    }[activeTab]}
                </div>
            </SidebarProvider>
        </ThemeProvider>
    );
}
