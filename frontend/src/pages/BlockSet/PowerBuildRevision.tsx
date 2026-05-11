import React from 'react';
import { RefreshCw, Search, ShieldAlert, FileSearch } from 'lucide-react';

const PowerBuildRevision: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#0B1120] text-gray-200 p-8 font-sans">
            <div className="max-w-4xl mx-auto">
                <div className="bg-[#111827] rounded-3xl border border-gray-800 p-12 shadow-2xl text-center space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-400"></div>
                    
                    <div className="bg-emerald-500/10 w-24 h-24 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20">
                        <RefreshCw className="w-12 h-12 text-emerald-400" />
                    </div>
                    
                    <div className="space-y-3">
                        <h1 className="text-3xl font-extrabold text-white">Revisão de Itens - Power Build</h1>
                        <p className="text-gray-400 text-lg max-w-xl mx-auto">
                            A ferramenta de comparação de revisões e histórico de alterações está sendo portada para a web.
                        </p>
                    </div>

                    <div className="bg-emerald-500/5 p-6 rounded-2xl border border-emerald-500/10 text-left space-y-4">
                        <div className="flex items-center gap-3 text-emerald-400 font-bold uppercase tracking-widest text-xs">
                            <ShieldAlert className="w-4 h-4" />
                            Funcionalidades Previstas
                        </div>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-300">
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                Comparativo Delta (Rev N vs Rev N-1)
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                Histórico de Alterações por Item
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                Registro de Motivo de Revisão
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                Relatórios de Evolução do Projeto
                            </li>
                        </ul>
                    </div>

                    <div className="pt-8 flex justify-center gap-4">
                        <button disabled className="px-6 py-2.5 bg-gray-800 text-gray-500 rounded-lg font-bold flex items-center gap-2 cursor-not-allowed">
                            <Search className="w-4 h-4" />
                            Comparar Agora
                        </button>
                        <button disabled className="px-6 py-2.5 bg-gray-800 text-gray-500 rounded-lg font-bold flex items-center gap-2 cursor-not-allowed">
                            <FileSearch className="w-4 h-4" />
                            Ver Histórico
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PowerBuildRevision;
