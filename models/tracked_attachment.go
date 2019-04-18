package models

import (
	"errors"
	"time"

	log "github.com/gophish/gophish/logger"
)

// TrackedAttachment contains the fields used for a Tracked Attachment model
type TrackedAttachment struct {
	Id           int64     `json:"id" gorm:"column:id; primary_key:yes"`
	UserId       int64     `json:"-" gorm:"column:user_id"`
	Name         string    `json:"name"`
	Type         string    `json:"type"`
	Content      []byte    `json:"content" gorm:"column:content"`
	ModifiedDate time.Time `json:"modified_date"`
	Filename     string    `json:"filename"`
}

// TrackedAttachment is used for a many-to-many relationship between 1..* Campaigns and 1..* Tracked Attachments
type CampaignTrackedAttachment struct {
	CampaignId          int64 `json:"-"`
	TrackedAttachmentId int64 `json:"-"`
}

var ErrTrackedAttachmentNameNotSpecified = errors.New("Tracked Attachment name not specified")

var ErrTrackedAttachmentContentNotSpecified = errors.New("Tracked Attachment content not specified")

var ErrTrackedAttachmentTypeNotSpecified = errors.New("Tracked Attachment type not specified")

var ErrTrackedAttachmentFilenameNotSpecified = errors.New("Tracked Attachment filename not specified")

// Validate ensures that a Tracked Attachment contains the appropriate details
func (ta *TrackedAttachment) Validate() error {
	if ta.Name == "" {
		return ErrTrackedAttachmentNameNotSpecified
	}
	if len(ta.Content) == 0 {
		return ErrTrackedAttachmentContentNotSpecified
	}
	if ta.Type == "" {
		return ErrTrackedAttachmentTypeNotSpecified
	}
	if ta.Filename == "" {
		return ErrTrackedAttachmentTypeNotSpecified
	}
	return nil
}

// GetTrackedAttachments returns the pages owned by the given user.
func GetTrackedAttachments(uid int64) ([]TrackedAttachment, error) {
	tas := []TrackedAttachment{}
	err := db.Where("user_id=?", uid).Find(&tas).Error
	if err != nil {
		log.Error(err)
		return tas, err
	}
	return tas, err
}

// GetTrackedAttachment returns the Tracked Attachment, if it exists, specified by the given id and user_id.
func GetTrackedAttachment(id int64, uid int64) (TrackedAttachment, error) {
	ta := TrackedAttachment{}
	err := db.Where("user_id=? and id=?", uid, id).Find(&ta).Error
	if err != nil {
		log.Error(err)
	}
	return ta, err
}

// GetTrackedAttachmentByName returns the Tracked Attachment, if it exists, specified by the given name and user_id.
func GetTrackedAttachmentByName(n string, uid int64) (TrackedAttachment, error) {
	ta := TrackedAttachment{}
	err := db.Where("user_id=? and name=?", uid, n).Find(&ta).Error
	if err != nil {
		log.Error(err)
	}
	return ta, err
}

// PostTrackedAttachment creates a new Tracked Attachment in the database.
func PostTrackedAttachment(ta *TrackedAttachment) error {
	if err := ta.Validate(); err != nil {
		return err
	}
	// Insert into the DB
	err := db.Save(ta).Error
	if err != nil {
		log.Error(err)
	}
	return err
}

// PutTrackedAttachment edits an existing Tracked Attachment in the database.
// Per the PUT Method RFC, it presumes all data for a Tracked Attachment is provided.
func PutTrackedAttachment(ta *TrackedAttachment) error {
	if err := ta.Validate(); err != nil {
		return err
	}
	err := db.Where("id=?", ta.Id).Save(ta).Error
	if err != nil {
		log.Error(err)
	}
	return err
}

// DeleteTrackedAttachment deletes an existing Tracked Attachment in the database.
// An error is returned if a Tracked Attachment with the given user id and Tracked Attachment id is not found.
func DeleteTrackedAttachment(id int64, uid int64) error {
	err := db.Where("user_id=?", uid).Delete(TrackedAttachment{Id: id}).Error
	if err != nil {
		log.Error(err)
	}
	return err
}
