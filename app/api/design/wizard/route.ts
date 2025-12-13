import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { designAgent } from "@/lib/ai/design-agent";

export const runtime = "nodejs";

// POST /api/design/wizard/step - Progress through wizard steps
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { designId, step, data } = await req.json();

        if (!designId || !step) {
            return NextResponse.json(
                { error: "designId and step are required" },
                { status: 400 }
            );
        }

        // Get current design package
        const { data: designPackage, error: fetchError } = await supabase
            .from("design_packages")
            .select("*")
            .eq("id", designId)
            .eq("user_id", user.id)
            .single();

        if (fetchError || !designPackage) {
            return NextResponse.json(
                { error: "Design package not found" },
                { status: 404 }
            );
        }

        // Handle each wizard step
        switch (step) {
            case 1:
                return handleStep1LogoSelection(designId, data, designPackage, supabase);

            case 2:
                return handleStep2ColorPalette(designId, data, designPackage, supabase);

            case 3:
                return handleStep3LaunchScreens(designId, data, designPackage, supabase);

            case 4:
                return handleStep4CoreScreens(designId, data, designPackage, supabase);

            case 5:
                return handleStep5FinalReview(designId, data, designPackage, supabase);

            default:
                return NextResponse.json(
                    { error: "Invalid step number" },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error("[Wizard API] Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Wizard step failed";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

// Step 1: User selects a logo
async function handleStep1LogoSelection(
    designId: string,
    data: any,
    designPackage: any,
    supabase: any
) {
    const { selectedLogoId } = data;

    if (!selectedLogoId) {
        return NextResponse.json(
            { error: "selectedLogoId is required" },
            { status: 400 }
        );
    }

    const wizardState = designPackage.wizard_state || {};
    const selectedLogo = wizardState.logoOptions?.find(
        (logo: any) => logo.id === selectedLogoId
    );

    if (!selectedLogo) {
        return NextResponse.json(
            { error: "Invalid logo selection" },
            { status: 400 }
        );
    }

    // Generate color palette options based on selected logo
    const colorPalettes = await designAgent.generateColorPalette(selectedLogo);

    // Update wizard state
    const { error } = await supabase
        .from("design_packages")
        .update({
            wizard_state: {
                ...wizardState,
                currentStep: 2,
                selectedLogo,
                colorPaletteOptions: colorPalettes,
            },
        })
        .eq("id", designId);

    if (error) {
        throw new Error(`Failed to update design package: ${error.message}`);
    }

    return NextResponse.json({
        step: 2,
        colorPalettes,
    });
}

// Step 2: User selects color palette
async function handleStep2ColorPalette(
    designId: string,
    data: any,
    designPackage: any,
    supabase: any
) {
    const { selectedPaletteIndex } = data;

    if (selectedPaletteIndex === undefined) {
        return NextResponse.json(
            { error: "selectedPaletteIndex is required" },
            { status: 400 }
        );
    }

    const wizardState = designPackage.wizard_state || {};
    const selectedPalette = wizardState.colorPaletteOptions?.[selectedPaletteIndex];

    if (!selectedPalette) {
        return NextResponse.json(
            { error: "Invalid palette selection" },
            { status: 400 }
        );
    }

    // Create branding guide
    const branding = {
        logo: wizardState.selectedLogo,
        colors: selectedPalette,
        typography: {
            heading: 'Inter',
            body: 'Inter',
            button: 'Inter',
        },
    };

    // Generate splash screen
    const splashScreen = await designAgent.generateSplashScreen(branding);

    // Update wizard state
    const { error } = await supabase
        .from("design_packages")
        .update({
            branding,
            wizard_state: {
                ...wizardState,
                currentStep: 3,
                selectedPalette,
            },
        })
        .eq("id", designId);

    if (error) {
        throw new Error(`Failed to update design package: ${error.message}`);
    }

    return NextResponse.json({
        step: 3,
        splashScreen,
    });
}

// Step 3: Generate and approve launch screens
async function handleStep3LaunchScreens(
    designId: string,
    data: any,
    designPackage: any,
    supabase: any
) {
    const { approved } = data;

    if (!approved) {
        // Regenerate splash screen
        const splashScreen = await designAgent.generateSplashScreen(designPackage.branding);
        return NextResponse.json({ splashScreen });
    }

    // Generate onboarding screens
    const featureSpec = await designAgent['generateFeatureSpec'](designPackage.app_idea);
    const onboardingScreens = await designAgent.generateOnboardingScreens(
        featureSpec,
        designPackage.branding
    );

    // Update wizard state
    const wizardState = designPackage.wizard_state || {};
    const { error } = await supabase
        .from("design_packages")
        .update({
            feature_spec: featureSpec,
            wizard_state: {
                ...wizardState,
                currentStep: 4,
            },
        })
        .eq("id", designId);

    if (error) {
        throw new Error(`Failed to update design package: ${error.message}`);
    }

    return NextResponse.json({
        step: 4,
        onboardingScreens,
    });
}

// Step 4: Generate core screens
async function handleStep4CoreScreens(
    designId: string,
    data: any,
    designPackage: any,
    supabase: any
) {
    // TODO: Implement core screen generation
    return NextResponse.json({
        step: 5,
        message: "Core screens generation coming soon",
    });
}

// Step 5: Final review and approval
async function handleStep5FinalReview(
    designId: string,
    data: any,
    designPackage: any,
    supabase: any
) {
    const { approved } = data;

    if (!approved) {
        return NextResponse.json({
            message: "Design not approved, user can make changes",
        });
    }

    // Mark design as approved
    const { error } = await supabase
        .from("design_packages")
        .update({
            status: 'approved',
        })
        .eq("id", designId);

    if (error) {
        throw new Error(`Failed to approve design: ${error.message}`);
    }

    return NextResponse.json({
        message: "Design approved! Ready for development.",
        designId,
    });
}
