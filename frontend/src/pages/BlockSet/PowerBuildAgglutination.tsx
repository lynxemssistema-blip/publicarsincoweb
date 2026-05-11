import React from 'react';
import { Grid, Layers, ShieldAlert, Boxes } from 'lucide-react';

const PowerBuildAgglutination: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#0B1120] text-gray-200 p-8 font-sans">
            <div className="max-w-4xl mx-auto">
                <div className="bg-[#111827] rounded-3xl border border-gray-800 p-12 shadow-2xl text-center space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
                    
                    <div className="bg-purple-500/10 w-24 h-24 rounded-2xl flex items-center justify-center mx-auto border border-purple-500/20">
                        <Grid className="w-12 h-12 text-purple-400" />
                    </div>
                    
                    <div className="space-y-3">
                        <h1 className="text-3xl font-extrabold text-white">Visualização de Aglutinação</h1>
                        <p className="text-gray-400 text-lg max-w-xl mx-auto">
                            Visualize a consolidação de materiais de múltiplas planilhas e projetos para otimização de suprimentos.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-[#1F2937] p-6 rounded-2xl border border-gray-700 text-center space-y-3">
                            <div className="bg-purple-500/20 w-12 h-12 rounded-xl flex items-center justify-center mx-auto text-purple-400">
                                <Layers className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-white">Consolidado</h3>
                            <p className="text-xs text-gray-400">Agrupamento inteligente por Código de Material</p>
                        </div>
                        <div className="bg-[#1F2937] p-6 rounded-2xl border border-gray-700 text-center space-y-3">
                            <div className="bg-purple-500/20 w-12 h-12 rounded-xl flex items-center justify-center mx-auto text-purple-400">
                                <Boxes className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-white">Estoque</h3>
                            <p className="text-xs text-gray-400">Integração com saldo atual de almoxarifado</p>
                        </div>
                        <div className="bg-[#1F2937] p-6 rounded-2xl border border-gray-700 text-center space-y-3">
                            <div className="bg-purple-500/20 w-12 h-12 rounded-xl flex items-center justify-center mx-auto text-purple-400">
                                <ShieldAlert className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-white">Alertas</h3>
                            <p className="text-xs text-gray-400">Identificação de materiais críticos ou faltantes</p>
                        </div>
                    </div>

                    <div className="bg-purple-500/5 p-4 rounded-xl border border-purple-500/20">
                        <p className="text-sm text-purple-300 font-medium italic">
                            "Módulo em fase de design de interface. Em breve disponível nesta plataforma."
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PowerBuildAgglutination;
