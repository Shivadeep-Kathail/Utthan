import { Link } from 'react-router-dom';

/**
 * Split-screen layout for auth forms (login, signup, forgot/reset password).
 *
 * Left: form content (scrollable on short viewports).
 * Right: decorative photo panel (hidden on mobile).
 */
function AuthLayout({ children, image, imageAlt }) {
  return (
    <div className="auth-split">
      {/* Form side */}
      <div className="auth-split-form">
        <div className="auth-split-form-inner">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 text-xl font-bold tracking-tight text-primary transition-colors hover:text-primary/80"
          >
            <span className="text-2xl" aria-hidden="true">✦</span>
            Utthan
          </Link>
          {children}
        </div>
      </div>

      {/* Photo side */}
      <div className="auth-split-photo" aria-hidden="true">
        <img
          src={image}
          alt={imageAlt}
          className="auth-split-photo-img"
          loading="eager"
        />
        <div className="auth-split-photo-scrim" />
      </div>
    </div>
  );
}

export { AuthLayout };
