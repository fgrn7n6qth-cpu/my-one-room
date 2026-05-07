package com.roomplanner.backend.auth;

import com.roomplanner.backend.auth.dto.AuthResponse;
import com.roomplanner.backend.auth.dto.EmailAvailabilityResponse;
import com.roomplanner.backend.auth.dto.EmailVerificationRequest;
import com.roomplanner.backend.auth.dto.LoginRequest;
import com.roomplanner.backend.auth.dto.PasswordResetRequest;
import com.roomplanner.backend.auth.dto.SignupRequest;
import com.roomplanner.backend.auth.dto.UpdateProfileRequest;
import com.roomplanner.backend.auth.dto.UserResponse;
import com.roomplanner.backend.auth.service.AuthTokenService;
import com.roomplanner.backend.auth.service.EmailVerificationService;
import com.roomplanner.backend.auth.service.UserAccountService;
import com.roomplanner.backend.workspace.service.WorkspaceStateService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserAccountService userAccountService;
    private final AuthTokenService authTokenService;
    private final EmailVerificationService emailVerificationService;
    private final WorkspaceStateService workspaceStateService;
    private final boolean emailVerificationRequired;

    public AuthController(
        UserAccountService userAccountService,
        AuthTokenService authTokenService,
        EmailVerificationService emailVerificationService,
        WorkspaceStateService workspaceStateService,
        @Value("${app.auth.email-verification-required:true}") boolean emailVerificationRequired
    ) {
        this.userAccountService = userAccountService;
        this.authTokenService = authTokenService;
        this.emailVerificationService = emailVerificationService;
        this.workspaceStateService = workspaceStateService;
        this.emailVerificationRequired = emailVerificationRequired;
    }

    @PostMapping("/email-availability")
    public EmailAvailabilityResponse checkEmailAvailability(@Valid @RequestBody EmailVerificationRequest request) {
        boolean available = userAccountService.isEmailAvailableForSignup(request.email());
        String message = available
            ? "가입 가능한 이메일입니다."
            : "이미 가입된 이메일입니다. 로그인하거나 비밀번호를 재설정해 주세요.";
        return new EmailAvailabilityResponse(request.email(), available, message);
    }

    @PostMapping("/signup/email-verification")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void sendSignupEmailVerification(@Valid @RequestBody EmailVerificationRequest request) {
        userAccountService.ensureEmailAvailableForSignup(request.email());
        emailVerificationService.sendSignupCode(request.email());
    }

    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse signup(@Valid @RequestBody SignupRequest request) {
        userAccountService.ensureEmailAvailableForSignup(request.email());
        if (emailVerificationRequired) {
            emailVerificationService.verifySignupCode(request.email(), request.verificationCode());
        }
        var user = userAccountService.register(request.name(), request.email(), request.password(), true);
        var token = authTokenService.issueToken(user.id());
        return AuthResponse.from(token, user);
    }

    @PostMapping("/password-reset/email-verification")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void sendPasswordResetVerification(@Valid @RequestBody EmailVerificationRequest request) {
        userAccountService.ensureLocalAccountCanResetPassword(request.email());
        emailVerificationService.sendPasswordResetCode(request.email());
    }

    @PostMapping("/password-reset")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(@Valid @RequestBody PasswordResetRequest request) {
        userAccountService.ensureLocalAccountCanResetPassword(request.email());
        if (emailVerificationRequired) {
            emailVerificationService.verifyPasswordResetCode(request.email(), request.verificationCode());
        }
        userAccountService.resetPassword(request.email(), request.password());
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        var user = userAccountService.authenticate(request.email(), request.password());
        var token = authTokenService.issueToken(user.id());
        return AuthResponse.from(token, user);
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal UserPrincipal principal) {
        var user = userAccountService.getById(principal.userId());
        return UserResponse.from(user);
    }

    @PatchMapping("/profile")
    public UserResponse updateProfile(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody UpdateProfileRequest request
    ) {
        var user = userAccountService.updateProfile(principal.userId(), request.name(), request.phone(), request.address());
        return UserResponse.from(user);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@AuthenticationPrincipal UserPrincipal principal) {
        authTokenService.revokeByUserId(principal.userId());
    }

    @DeleteMapping("/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAccount(@AuthenticationPrincipal UserPrincipal principal) {
        userAccountService.deleteById(principal.userId());
        authTokenService.revokeByUserId(principal.userId());
        workspaceStateService.deleteByUserId(principal.userId());
    }
}
