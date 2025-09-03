/** VoAPI 构建服务 */
export class VoAPIBuilder {
    /** 构建 VoAPI 模型供应商格式数据 */
    buildFirms(allModelsData) {
        const firms = [];
        const providerIds = Object.keys(allModelsData.providers).sort();
        for (const providerId of providerIds) {
            const provider = allModelsData.providers[providerId];
            // 构建供应商数据
            firms.push({
                name: provider.name || providerId,
                description: provider.description || '',
                icon: (provider.icon || provider.lobeIcon || '').toLowerCase().replaceAll('.', '-'),
                status: 1,
            });
        }
        return firms;
    }
}
//# sourceMappingURL=voapi-builder.js.map